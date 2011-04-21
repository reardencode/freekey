import json, struct
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Hash import SHA256

KEY_LEN = 32 # default key length, bytes

class EncryptionManager:
    '''Holds an encryption key and encrypts/decrypts data.

    >>> em = EncryptionManager()
    >>> length = 13
    >>> p = 'Somepass'
    >>> em.newkey(p, length)
    >>> len(em.key) == length
    True
    >>> len(em.key) < len(em.stored_key())
    True
    >>> em2 = EncryptionManager()
    >>> em2.loadkey(em.stored_key(), p, length)
    >>> em.key == em2.key
    True

    >>> em.newkey()
    >>> len(em.key) == KEY_LEN
    True
    >>> em2 = EncryptionManager()
    >>> em2.loadkey(em.key)
    >>> em.key == em2.key
    True

    >>> p = 'Otherpass'
    >>> ciph = em.newkey(p)
    >>> len(em.key) == KEY_LEN
    True
    >>> len(em.key) <= len(em.stored_key())
    True
    >>> em2 = EncryptionManager()
    >>> em2.loadkey(em.stored_key(), p)
    >>> em.key == em2.key
    True

    >>> p2 = 'Nextpass'
    >>> data = em.encrypt({'site':'example.com','username':'jd','password':p2})
    >>> len(data) % AES.block_size == 0
    True
    >>> data.find('site')
    -1
    >>> d = em.decrypt(data)
    >>> d.pop('site')
    u'example.com'
    >>> d.pop('username')
    u'jd'
    >>> d.pop('password') == p2
    True
    >>> d
    {}
    '''

    ekey = None

    def stored_key(self):
        return self.ekey or self.key

    def loadkey(self, data, passphrase=None, length=KEY_LEN):
        if passphrase:
            passkey = SHA256.new(passphrase).digest()
            cipher = AES.new(passkey, AES.MODE_ECB)
            self.key = cipher.decrypt(data)[:length]
            self.ekey = data
        else:
            self.key = data

    def _encrypt(self, cipher, data):
        pad = len(data) % cipher.block_size
        pad = pad and cipher.block_size - pad or 0
        return cipher.encrypt(data+get_random_bytes(pad))

    def _raw_encrypt(self, data):
        cipher = AES.new(self.key, AES.MODE_ECB)
        return cipher.encrypt(data)

    def newkey(self, passphrase=None, length=KEY_LEN):
        self.key = get_random_bytes(length)
        if passphrase:
            passkey = SHA256.new(passphrase).digest()
            cipher = AES.new(passkey, AES.MODE_ECB)
            self.ekey = self._encrypt(cipher, self.key)

    def encrypt(self, kw):
        val = json.dumps(kw)
        data = struct.pack('!I', len(val)) + val
        iv = get_random_bytes(AES.block_size)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return iv + self._encrypt(cipher, data)

    def decrypt(self, data):
        iv = data[:AES.block_size]
        data = data[AES.block_size:]
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        val = cipher.decrypt(data)
        length = struct.unpack('!I', val[:4])[0]
        val = val[4:4+length]
        return json.loads(val)
