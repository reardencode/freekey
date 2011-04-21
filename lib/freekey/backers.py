import bisect, os, time, uuid
from collections import deque

class Backer:
    def __init__(self, expire_seconds):
        self.exps = expire_seconds

    def _keyf(self, x):
        return int(os.path.splitext(x)[1][1:])

    def _acquire(self, spin_time, timeout):
        '''Lock the repository'''
        self.uuid = uuid.uuid1()
        while timeout > 0:
            try:
                self._write_lock(self.uuid.bytes)
            except IOError, e:
                if e.errno != 13:
                    raise
            self._lockdown()
            if self._read_lock() == self.uuid.bytes:
                return
            time.sleep(spin_time)
            timeout -= spin_time
        raise Exception, 'Failed to acquire lock before timeout'

    def _version(self):
        '''No lock needed'''
        l = self._list()
        l.sort(key=self._keyf)
        return l and self._keyf(l[-1]) or None

    def readpack(self, newer_than=None):
        '''No lock needed'''
        version = self._version()
        if version is not None and (newer_than is None or version > newer_than):
            return version, self._open_read(version)
        return 0, None

    def writepack(self, data, spin_time=1, timeout=60):
        self._acquire(spin_time, timeout)
        now = time.time()
        l = sorted(self._list(), key=self._keyf)
        latest = l and l[-1] or None
        version = (latest and self._keyf(latest) or 0) + 1
        rml = map(lambda x: x[1], filter(
            lambda x: x != latest and x[0] < now - self.exps, map(
                lambda x: (self._mtime(x), x), l)))
        svs = set(l)
        svs.difference_update(rml)
        new = self._write(svs, version, data, spin_time, timeout)
        svs.add(new)
        self._release_and_clean(svs, rml)
        return version

class DiskBacker(Backer):

    def __init__(self, path, expire_seconds, **kw):
        Backer.__init__(self, expire_seconds)
        self.pack_base = os.path.join(path, 'pack')
        self.lock_name = os.path.join(path, '.lock')
        if not os.path.isdir(path):
            os.makedirs(path)

    def _mtime(self, fn):
        return os.stat(fn).st_mtime

    def _lockdown(self):
        import stat
        os.chmod(self.lock_name, stat.S_IRUSR)

    def _write_lock(self, data):
        with open(self.lock_name, 'wb') as f:
            f.write(data)

    def _read_lock(self):
        with open(self.lock_name, 'rb') as f:
            return f.read()

    _filename = lambda self, version: '%s.%d' % (self.pack_base, version)

    def _write(self, svs, version, data, spin_time, timeout):
        fn = self._filename(version)
        with open(fn, 'wb') as f:
            f.write(data)
        return fn

    def _open_read(self, version):
        return open(self._filename(version), 'rb')

    def _list(self):
        import glob
        return glob.glob('%s.*' % self.pack_base)

    def _release_and_clean(self, svs, rml):
        import stat
        for fn in svs:
            os.chmod(fn, stat.S_IRUSR)
        os.chmod(self.lock_name, stat.S_IRUSR|stat.S_IWUSR)
        for fn in rml:
            try:
                os.chmod(fn, stat.S_IRUSR|stat.S_IWUSR)
                os.remove(fn)
            except:
                pass

class S3Backer(Backer):

    policy = {"Statement":[{
        "Sid":"DenyUpdateDelete",
        "Effect":"Deny",
        "Principal":{"AWS":"*"},
        "Action":["s3:DeleteObject","s3:PutObject"],
        "Resource":[],
        }]}

    def __init__(self, bucket, access_key, secret_key, expire_seconds,
            **kw):
        Backer.__init__(self, expire_seconds)
        from boto.exception import S3ResponseError
        from boto.s3.connection import S3Connection
        conn = S3Connection(access_key, secret_key)
        try:
            self.bucket = conn.get_bucket(bucket)
        except S3ResponseError, e:
            if e.status != 404:
                raise
            self.bucket = conn.create_bucket(bucket)
    
    def _make_policy(self, names=['*']):
        import json
        policy = self.policy
        fmt = 'arn:aws:s3:::%s/%%s' % self.bucket.name
        policy['Statement'][0]['Resource'] = [fmt % name for name in names]
        return json.dumps(policy)

    def _keyf(self, x):
        return Backer._keyf(self, x.name)

    def _mtime(self, key):
        import time
        t = key.last_modified
        try:
            return time.mktime(time.strptime(t, '%Y-%m-%dT%H:%M:%S.000Z'))
        except:
            return time.mktime(time.strptime(t, '%a, %d %b %Y %H:%M:%S %Z'))

    def _lockdown(self):
        self.bucket.set_policy(self._make_policy())

    def _write_lock(self, data):
        from boto.exception import S3ResponseError
        try:
            key = self.bucket.get_key('lock')
            if key is None:
                key = self.bucket.new_key('lock')
            key.set_contents_from_string(data)
        except S3ResponseError, e:
            if e.status == 403:
                raise IOError(13, str(e))
            raise

    def _read_lock(self):
        key = self.bucket.get_key('lock')
        return key and key.get_contents_as_string() or None

    _keyname = lambda self, version: 'pack.%d' % version

    def _write(self, svs, version, data, spin_time, timeout):
        from boto.exception import S3ResponseError
        names = [k.name for k in svs]
        names.append('lock')
        self.bucket.set_policy(self._make_policy(names))
        key = self.bucket.new_key(self._keyname(version))
        while timeout:
            try:
                key.set_contents_from_string(data)
                break
            except S3ResponseError, e:
                if e.status != 403:
                    raise
            time.sleep(spin_time)
            timeout -= spin_time
        return key

    def _open_read(self, version):
        key = self.bucket.get_key(self._keyname(version))
        return key.open_read()

    def _list(self):
        return self.bucket.get_all_keys(prefix='pack.')

    def _release_and_clean(self, svs, rml):
        self.bucket.set_policy(self._make_policy(k.name for k in svs))
        for k in rml:
            try:
                k.delete()
            except:
                pass
