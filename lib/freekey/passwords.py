import math, random, urlparse
from itertools import cycle, islice, chain
from Crypto import Random
from Crypto.Hash import SHA256

UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
LOWER = 'abcdefghijklmnopqrstuvwxyz'
NUM   = '0123456789'
PUNC  = ''.join(sorted('`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?'))

def charstring(upper=True, lower=True, num=True, punc=PUNC):
    if isinstance(punc, basestring):
        punc = frozenset(punc)

    def chars():
        if upper:
            yield UPPER
        if lower:
            yield LOWER
        if num:
            yield NUM
        yield filter(lambda x: x in punc, PUNC)

    return list(chain(*chars()))

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

def _pass(source, nchars, chars={}):
    cs = charstring(**chars)
    nopts = len(cs)
    nbytes = int(math.ceil(math.log(nopts**nchars, 256)))
    val = 0L
    for byte in islice(source, nbytes):
        val = val*(2**8) + ord(byte)
    rv = ''
    while len(rv) < nchars:
        rv += cs[val%nopts]
        val //= nopts
    return rv

def hashpass(em, site, version, username=None, nchars=10, chars={}):
    '''Make a hash password of length nchars based on key site and username.

    With the same settings this will always generate the same password.
    
    >>> from freekey.encryption_manager import EncryptionManager
    >>> em = EncryptionManager()
    >>> _ = em.newkey('Somepass')
    >>> p = hashpass(em, 'reardencode.com', 0)
    >>> len(p)
    10
    >>> p2 = hashpass(em, 'http://www.reardencode.com/someurl', 0)
    >>> p == p2
    True
    >>> p3 = hashpass(em, 'reardencode.com', 0, 'hank')
    >>> p3 == p2
    False
    >>> p4 = hashpass(em, 'reardencode.com', 1)
    >>> p4 == p2
    False
    '''
    if site.find('://') >= 0:
        site = simplify(site)
    if username:
        v = '%s %s %d' % (site, username, version)
    else:
        v = '%s %d' % (site, version)
    return _pass(cycle(em._raw_encrypt(SHA256.new(v).digest())), nchars, chars)

def randompass(min_length=8, max_length=16, chars={}):
    '''Make a random password between min and max length.

    >>> p = randompass()
    >>> 8 <= len(p) <= 16
    True
    >>> p = randompass(chars={'upper': False, 'lower': False, 'punc': ''})
    >>> p.find('a')
    -1
    '''
    nchars = random.randint(min_length, max_length)
    def source():
        r = Random.new()
        while True:
            yield r.read(1)
    return _pass(source(), nchars, chars)

if __name__ == '__main__':
    import doctest
    doctest.testmod()
