import mmap, os, shutil, struct, time
from threading import Lock, Timer

class PackFile:
    '''
    Simple binary packfile.

    >>> from freekey.backers import DiskBacker
    >>> from freekey.encryption_manager import EncryptionManager
    >>> from freekey.passwords import randompass
    >>> import tempfile
    >>> d = tempfile.mkdtemp()
    >>> backer = DiskBacker(d)
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

    def __init__(self, backer):
        self.backer = backer
        self.initialized = False
        self.em = self.pack = None
        self.lock = Lock()
        with self.lock:
            self.dirty = None
            raw_pack = backer.readpack()
            if raw_pack:
                keylen = struct.unpack('!I', raw_pack[0:4])[0]
                self.key = raw_pack[4:4+keylen]
                self.raw_pack = raw_pack[4+keylen:]

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

    def init(self, em):
        if self.initialized:
            return
        self.em = em
        if hasattr(self, 'key'):
            delattr(self, 'key')
        self.initialized = True
        with self.lock:
            if hasattr(self, 'raw_pack'):
                idxlen = struct.unpack('!I', self.raw_pack[:4])[0]
                pofs = 4+idxlen
                self.pack = em.decrypt(self.raw_pack[4:pofs])
                for k, v in self.pack.iteritems():
                    vofs = pofs + v
                    vlen = struct.unpack('!I', self.raw_pack[vofs:vofs+4])[0]
                    self.pack[k] = self.raw_pack[vofs+4:vofs+4+vlen]
                delattr(self, 'raw_pack')
            else:
                self.pack = {}
                self.dirty = time.time()
            self.timer = Timer(5, self._write_pack)
            self.timer.start()

    def _write_pack(self, final=False):
        with self.lock:
            if final and self.timer:
                self.timer.cancel()
                self.timer = None
            if self.dirty and (final or time.time()-self.dirty > 5):
                self.backer.writepack(self._updated_pack())
                self.dirty = None
            if self.timer:
                self.timer = Timer(5, self._write_pack)
                self.timer.start()

    def _gen_raw(self, d, pack):
        total = 0
        for k,v in pack.iteritems():
            d[k] = total
            vlen = len(v)
            yield struct.pack('!I', vlen) + v
            total += 4 + vlen

    def _updated_pack(self):
        key = self.em.stored_key()
        d = {}
        data = ''.join(self._gen_raw(d, self.pack))
        idx = self.em.encrypt(d)
        return struct.pack('!I', len(key)) + key + \
                struct.pack('!I', len(idx)) + idx + data

    def set(self, key, value):
        data = self.em.encrypt(value)
        with self.lock:
            self.pack[key] = data
            self.dirty = time.time()

    def remove(self, key):
        with self.lock:
            self.pack.pop(key, None)
            self.dirty = time.time()

    def get(self, key):
        with self.lock:
            data = self.pack.get(key, None)
        return data and self.em.decrypt(data) or None
        
if __name__ == '__main__':
    import doctest
    doctest.testmod()
