import mmap, os, shutil, struct, time
from threading import Lock, Timer

class Value:
    def __init__(self, val):
        self.val = val

    def merge(self, other):
        return other

class Tombstone(Value):
    def merge(self, other):
        if self.val == other.val:
            return self
        return other

class Updated(Value):
    def __init__(self, val, old):
        Value.__init__(self, val)
        self.old = old

    def merge(self, other):
        if self.old == other.val:
            return self
        if self.val == other.val:
            return other
        return Updated(self.val, other.val)

class PackFile:
    '''
    Simple binary packfile.

    >>> from freekey.backers import DiskBacker
    >>> from freekey.encryption_manager import EncryptionManager
    >>> from freekey.passwords import randompass
    >>> import tempfile
    >>> d = tempfile.mkdtemp()
    >>> backer = DiskBacker(d, 100)
    >>> em = EncryptionManager()
    >>> em.newkey()
    >>> pf = PackFile(backer)
    >>> pf.init(em)
    >>> k = 'jd@example.com'
    >>> p = randompass()
    >>> v = {'site': 'example.com', 'username': 'jd', 'password': p}
    >>> pf.set(k, v)
    >>> v2 = pf.get(k)
    >>> v2 == v
    True
    >>> pf.close()
    >>> pf = PackFile(backer)
    >>> pf.init(em)
    >>> k3 = 'bb@example.org'
    >>> p3 = randompass()
    >>> v3 = {'site': 'example.org', 'username': 'bb', 'version': 0}
    >>> pf.set(k3, v3)
    >>> v4 = pf.get(k3)
    >>> v4 == v3
    True
    >>> pf.remove(k)
    >>> pf.get(k)
    >>> pf.close()
    >>> pf = PackFile(backer)
    >>> pf.init(em)
    >>> pf.remove(k3)
    >>> pf.get(k3)
    >>> pf.close()
    >>> shutil.rmtree(d)
    '''

    def __init__(self, backer, dirty_check=5, sync_check=30):
        self.dirty_check = dirty_check
        self.sync_check = sync_check
        self.backer = backer
        self.initialized = False
        self.timer = self.em = self.pack = None
        self.lock = Lock()
        with self.lock:
            self.dirty = None
            self.sync_time = time.time()
            self.version, packfile = backer.readpack()
            if packfile:
                try:
                    self.key = self._load_header(packfile)
                    self.packfile = packfile
                except:
                    packfile.close()
                    raise

    def close(self):
        self._write_pack(True)
        self.pack = None
        self.initialized = False

    def __del__(self):
        self.close()

    def get_key(self):
        if hasattr(self, 'key'):
            return self.key
        return None

    def _load_header(self, packfile):
        assert(0xF9EE0000==struct.unpack('!I', packfile.read(4))[0])
        keylen = struct.unpack('!H', packfile.read(2))[0]
        return packfile.read(keylen)

    def _unpack(self, packfile):
        vlen = struct.unpack('!H', packfile.read(2))[0]
        return Value(packfile.read(vlen))

    def _load_pack(self, packfile):
        idxlen = struct.unpack('!I', packfile.read(4))[0]
        idx = self.em.decrypt(packfile.read(idxlen))
        return dict((k, self._unpack(packfile)) for k in idx)

    def _start_timer(self):
        '''Call while holding lock'''
        check_in = min(self.dirty_check, self.sync_check)
        self.timer = Timer(check_in, self._write_pack)
        self.timer.start()

    def init(self, em):
        if self.initialized:
            return
        self.em = em
        if hasattr(self, 'key'):
            delattr(self, 'key')
        self.initialized = True
        with self.lock:
            try:
                if hasattr(self, 'packfile'):
                    self.pack = self._load_pack(self.packfile)
                    delattr(self, 'packfile')
                else:
                    self.pack = {}
                    self.dirty = time.time()
                self._start_timer()
            finally:
                if hasattr(self, 'packfile'):
                    self.packfile.close()

    def sync(self):
        with self.lock:
            self.sync_time = 0
        self._write_pack()

    def _merge_pack(self, packfile):
        '''Call while holding lock'''
        merge_pack = self._load_pack(packfile)
        for rk, rv in merge_pack.iteritems():
            if rk in self.pack:
                self.pack[rk] = self.pack[rk].merge(rv)
            else:
                self.pack[rk] = rv

    def _sync(self, force=False):
        '''Call while holding lock'''
        if not force:
            if time.time() - self.sync_time < self.sync_check:
                return False
        merge_version, packfile = self.backer.readpack(newer_than=self.version)
        if packfile:
            try:
                merge_key = self._load_header(packfile)
                assert(merge_key==self.em.stored_key())
                self._merge_pack(packfile)
                self.version = merge_version
                self.sync_time = time.time()
                return True
            finally:
                packfile.close()

    def _write_pack(self, final=False):
        with self.lock:
            now = time.time()
            merged = self._sync()
            if merged or (self.dirty and 
                    (final or now - self.dirty > self.dirty_check)):
                while True:
                    new_pack = self._updated_pack()
                    new_version = self.backer.writepack(new_pack)
                    if new_version is not None:
                        self.version = new_version
                        break
                    else:
                        self._sync(True)
                self.dirty = None
            if self.timer:
                self.timer.cancel()
                if final:
                    self.timer = None
                else:
                    self._start_timer()

    def _gen_raw(self, pack):
        for k, v in pack.iteritems():
            if isinstance(v, Tombstone):
                continue
            yield k, struct.pack('!H', len(v.val)) + v.val

    def _updated_pack(self):
        key = self.em.stored_key()
        raw = self._gen_raw(self.pack)
        l, data = raw and zip(*raw) or ((),())
        idx = self.em.encrypt(l)
        return ''.join((struct.pack('!IH', 0xF9EE0000, len(key)), key,
                struct.pack('!I', len(idx)) + idx, ''.join(data)))

    def set(self, key, value):
        data = self.em.encrypt(value)
        with self.lock:
            if key in self.pack:
                self.pack[key] = Updated(data)
            else:
                self.pack[key] = Value(data)
            self.dirty = time.time()

    def remove(self, key):
        with self.lock:
            if key in self.pack:
                self.pack[key] = Tombstone(self.pack[key].val)
            self.dirty = time.time()

    def get(self, key):
        with self.lock:
            v = self.pack.get(key, None)
        if v and not isinstance(v, Tombstone):
            return self.em.decrypt(v.val)
        return None
        
if __name__ == '__main__':
    import doctest
    doctest.testmod()
