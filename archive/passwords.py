import math, random
from itertools import cycle, islice, chain
from Crypto.Random import get_random_bytes
from Crypto.Hash import SHA256
from Crypto.Util.number import bytes_to_long

CTS = {
        'upper' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        'lower' : 'abcdefghijklmnopqrstuvwxyz',
        'num'   : '0123456789',
        'punc'  : ''.join(sorted('`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?')),
        }

def charstring(chars):
    d = chars.fulldict()

    def g_chars():
        for ct in ('upper', 'lower', 'num'):
            if d[ct]:
                yield CTS[ct]
        yield d['punc']

    return list(chain(*g_chars()))

def _words(num):
    words = 0
    while num:
        num >>= 32
        words += 1
    return words

def _pass(source, length, chars, require):
    full = charstring(chars)
    nfull = length
    entropy_needed = 1L
    for ct in require:
        entropy_needed *= nfull
        entropy_needed *= len(CTS[ct])
        nfull -= 1
    entropy_needed *= len(full) ** nfull
    entropy = bytes_to_long(source(4 * _words(entropy_needed)))
    positions = range(length)
    special = {}
    for ct in require:
        left = len(positions)
        special[positions.pop(entropy % left)] = CTS[ct]
        entropy //= left
    rv = ''
    for i in range(length):
        choices = special.get(i, full)
        rv += choices[entropy % len(choices)]
        entropy //= len(choices)
    return rv

def hashpass(em, site, username, version, length, chars, require):
    '''Make a hash password of length chars based on key site and username.

    With the same settings this will always generate the same password.
    
    >>> from freekey.encryption_manager import EncryptionManager
    >>> from freekey.config import Config
    >>> c = Config().chars
    >>> em = EncryptionManager()
    >>> _ = em.newkey('Somepass')
    >>> p = hashpass(em, 'reardencode.com', None, 0, 10, c, ())
    >>> len(p)
    10
    >>> p2 = hashpass(em, 'reardencode.com', 'hank', 0, 10, c, ())
    >>> p2 == p
    False
    >>> p3 = hashpass(em, 'reardencode.com', None, 1, 10, c, ())
    >>> p3 == p
    False
    >>> p4 = hashpass(em, 'reardencode.com', None, 0, 10, c, ('num',))
    >>> p4 == p
    False
    '''
    if username:
        v = '%s %s %d' % (site, username, version)
    else:
        v = '%s %d' % (site, version)
    def source(length):
        hashbytes = em._raw_encrypt(SHA256.new(v).digest())
        while length > len(hashbytes):
            hashbytes += hashbytes
        return hashbytes[:length]
    return _pass(source, length, chars, require)

def randompass(length, chars, require):
    '''Make a random password between min and max length.

    >>> from freekey.config import Config
    >>> c = Config().chars
    >>> p = randompass(10, c, ())
    >>> len(p)
    10
    >>> c.upper = False
    >>> p = randompass(10, c, ('lower',))
    >>> p.find('A')
    -1
    >>> c.lower = False
    >>> c.punc = ''
    >>> p = randompass(10, c, ())
    >>> p.find('a')
    -1
    >>> p = randompass(10, c, ('lower',))
    >>> for c in CTS['lower']:
    ...     if c in p:
    ...         print 'Found'
    Found
    '''
    return _pass(get_random_bytes, length, chars, require)
