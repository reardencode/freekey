'''
This module defines key and password creation functions.

>>> p = randompass(8, 16)
>>> key, ciph = newkey(p)
>>> len(key) == KEY_LEN
True
>>> len(key) <= len(ciph)
True
>>> key_post = loadkey(p, ciph)
>>> key == key_post
True
>>> length = 13
>>> p = randompass(8, 16)
>>> key, ciph = newkey(p, length)
>>> len(key) == length
True
>>> len(key) <= len(ciph)
True
>>> key_post = loadkey(p, ciph, length)
>>> key == key_post
True
'''

import math, random, sys, urlparse
from itertools import cycle
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from Crypto.Hash import SHA256

UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
LOWER = 'abcdefghijklmnopqrstuvwxyz'
NUM   = '0123456789'
PUNC  = '`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?'

DEF_CHARS = UPPER + LOWER + NUM + PUNC

KEY_LEN = 32

def loadkey(passphrase, ciph, length=KEY_LEN):
    passkey = SHA256.new(passphrase).digest()
    keyc = AES.new(passkey, AES.MODE_ECB)
    return keyc.decrypt(ciph)[:length]

def newkey(passphrase, length=KEY_LEN):
    key = get_random_bytes(length)
    passkey = SHA256.new(passphrase).digest()
    keyc = AES.new(passkey, AES.MODE_ECB)
    pad = length % keyc.block_size
    pad = pad and keyc.block_size - pad or 0
    ciph = keyc.encrypt(key+get_random_bytes(pad))
    return key, ciph

def simplify(url):
    '''Take a URL and simplify it to a domain w/o www.

    >>> simplify('https://online.citibank.com/US/JPS/portal/Index.do')
    'online.citibank.com'
    >>> simplify('https://www.wellsfargo.com/')
    'wellsfargo.com'
    '''
    domain = urlparse.urlparse(url)[1]
    if domain.startswith('www.'):
        return domain[4:]
    return domain

def hashpass(site, key, username=None, nchars=10, chars=DEF_CHARS):
    '''Make a hash password of length nchars based on key site and username.

    With the same settings this will always generate the same password.
    
    >>> key = get_random_bytes(KEY_LEN)
    >>> p = hashpass('reardencode.com', key)
    >>> len(p)
    10
    >>> p2 = hashpass('http://www.reardencode.com/someurl', key)
    >>> p == p2
    True
    >>> p3 = hashpass('reardencode.com', key, 'hank')
    >>> p3 == p2
    False
    '''
    if site.find('://') >= 0:
        site = simplify(site)
    nopts = len(chars)
    nbytes = int(math.ceil(math.log(nopts**nchars, 256)))
    c = AES.new(key, AES.MODE_ECB)
    s = username and '%s %s' % (site, username) or site
    raw = c.encrypt(SHA256.new(s).digest())
    val = 0L
    for _, byte in zip(range(nbytes), cycle(raw)):
        val = val*(2**8) + ord(byte)
    rv = ''
    while len(rv) < nchars:
        rv += chars[val%nopts]
        val //= nopts
    return rv

def randompass(min_length=8, max_length=16, chars=DEF_CHARS):
    '''Make a random password between min and max length.

    >>> p = randompass(8, 16)
    >>> 8 <= len(p) <= 16
    True
    >>> p = randompass(8, 16, '0123456789')
    >>> p.find('a')
    -1
    '''
    nopts = len(chars)
    nchars = random.randint(min_length, max_length)
    nbytes = int(math.ceil(math.log(nopts**nchars, 256)))
    val = 0L
    for byte in get_random_bytes(nbytes):
        val = val*(2**8) + ord(byte)
    rv = ''
    while len(rv) < nchars:
        rv += chars[val%nopts]
        val //= nopts
    return rv

#def encrypt(key, site, username=None, password=None):
#    data = struct.pack('!BBB', len(site), len(username), len(password)) +\
#            site + username + password
#
if __name__ == '__main__':
    import doctest
    doctest.testmod()
