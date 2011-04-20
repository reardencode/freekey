import math, random, urlparse
from itertools import cycle, islice, chain
from Crypto import Random
from Crypto.Hash import SHA256

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

def simplify(url):
    '''Take a URL and simplify it to a domain w/o www.

    >>> simplify('https://online.citibank.com/US/JPS/portal/Index.do')
    'online.citibank.com'
    >>> simplify('https://www.wellsfargo.com/')
    'wellsfargo.com'
    >>> simplify('www.wellsfargo.com/somesite')
    'wellsfargo.com'
    '''
    if not url.find('://') >= 0:
        url = 'http://' + url
    domain = urlparse.urlparse(url)[1]
    if domain.startswith('www.'):
        return domain[4:]
    return domain

def _pass(source, length, chars, require):
    full = charstring(chars)
    nfull = length
    entropy_needed = 1L
    for ct in require:
        entropy_needed *= nfull
        entropy_needed *= len(CTS[ct])
        nfull -= 1
    entropy_needed *= len(full) ** nfull
    nbytes = int(math.ceil(math.log(entropy_needed, 2 ** 8)))
    entropy = 0L
    for byte in islice(source, nbytes):
        entropy = entropy * (2 ** 8) + ord(byte)
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
    >>> p = hashpass(em, 'reardencode.com/someurl', None, 0, 10, c, ())
    >>> len(p)
    10
    >>> p2 = hashpass(em, 'http://www.reardencode.com', None, 0, 10, c, ())
    >>> p == p2
    True
    >>> p3 = hashpass(em, 'reardencode.com', 'hank', 0, 10, c, ())
    >>> p3 == p2
    False
    >>> p4 = hashpass(em, 'reardencode.com', None, 1, 10, c, ())
    >>> p4 == p2
    False
    >>> p5 = hashpass(em, 'reardencode.com', None, 0, 10, c, ('num',))
    >>> p5 == p2
    False
    '''
    if site.find('/') >= 0:
        site = simplify(site)
    if username:
        v = '%s %s %d' % (site, username, version)
    else:
        v = '%s %d' % (site, version)
    source = cycle(em._raw_encrypt(SHA256.new(v).digest()))
    return _pass(source, length, chars, require)

def random_bytes():
    r = Random.new()
    while True:
        yield r.read(1)

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
    source = random_bytes()
    return _pass(source, length, chars, require)

if __name__ == '__main__':
    import doctest
    doctest.testmod()
