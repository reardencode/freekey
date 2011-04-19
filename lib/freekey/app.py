import os
from freekey.encryption_manager import EncryptionManager
from freekey.config import Config
from freekey.pack import PackFile
from freekey.passwords import hashpass, randompass

class Application:

    def __init__(self, basepath):
        self.em = EncryptionManager()
        self.config = Config(os.path.join(basepath, 'rc'))
        bc = __import__('freekey.backers', fromlist=[self.config.backer.clz])
        self.pack = PackFile(bc(**self.config.backer.fulldict()))
        if not self.config.usepwd:
            self.em.loadkey(self.pack.key)

    def authenticate(self, passphrase):
        self.em.loadkey(self.pack.key, passphrase)

    def hashpass(self, site, username=None, length=10):
        p = hashpass(self.config.chars, em, site, username, length)


if __name__ == '__main__':
    import doctest
    doctest.testmod()
