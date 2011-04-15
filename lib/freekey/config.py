'''Simple configuration container.

>>> import tempfile, shutil
>>> p = tempfile.mkdtemp()
>>> c = Config(os.path.join(p,'rc'))
>>> c.type
'random'
>>> c.chars
{}
>>> c.type = 'hash'
>>> c.type
'hash'
>>> c.save()
>>> c = Config(os.path.join(p, 'rc'))
>>> c.type
u'hash'
>>> shutil.rmtree(p)
'''

import json, os
from freekey.passwords import PUNC

CONFIG = {
        'usepwd': (bool, True),
        'type': (frozenset(('random', 'hash')), 'random'),
        'chars': {
            'upper': (bool, 'True'),
            'lower': (bool, 'True'),
            'num': (bool, 'True'),
            'punc': (PUNC, PUNC),
            },
        'backer': {
            'class': (frozenset(('DiskBacker', 'S3Backer')), 'DiskBacker'),
            'path': (basestring, None),
            },
        }

def makeConfig(name, config):
    def fget_f(attr):
        def fget(self):
            if hasattr(self, attr):
                return getattr(self, attr)
            return self._defaults.get(attr, None)
        return fget
    def fset_f(t, attr):
        def fset(self, v):
            assert(isinstance(v, t))
            setattr(self, attr, v)
        return fset
    def fsetstr_f(vals, attr):
        vals = frozenset(vals)
        def fset(self, v):
            v2 = ''.join(c for c in sorted(v) if c in vals)
            assert(len(v)==len(v2))
            setattr(self, attr, v2)
        return fset
    def fsetset_f(vals, attr):
        def fset(self, v):
            assert(v in vals)
            setattr(self, attr, v)
        return fset

    savethese = []
    recursethese = []

    defaults = {}
    attrs = {'_defaults': defaults}
    for k,v in config.iteritems():
        attr = '_%s' % k
        if isinstance(v, dict):
            attrs[attr] = makeConfig(k, v)
            prop = property(fget_f(attr))
            recursethese.append((k,attr))
        elif v[0] in (bool, basestring):
            prop = property(fget_f(attr), fset_f(v[0], attr))
        elif isinstance(v[0], frozenset):
            prop = property(fget_f(attr), fsetset_f(v[0], attr))
        elif isinstance(v[0], basestring):
            prop = property(fget_f(attr), fsetstr_f(v[0], attr))
        else:
            raise AttributeError, '%s invalid typedef' % v[0]
        if isinstance(v, tuple) and v[1] is not None:
            defaults[attr] = v[1]
            savethese.append((k,attr))
        attrs[k] = prop

    def __init__(self, configpath=None, d=None):
        if configpath is not None:
            self._path = configpath
            if os.path.isfile(self._path):
                with open(self._path, 'r') as f:
                    d = json.load(f)
        for k, attr in recursethese:
            v = d and d.get(k, None) or None
            setattr(self, attr, getattr(self, attr)(d=v))
        if d:
            for k, attr in savethese:
                if k in d:
                    setattr(self, k, d[k])
    attrs['__init__'] = __init__

    def todict(self):
        d = {}
        for k,attr in savethese:
            if hasattr(self, attr):
                v = getattr(self, attr)
                if v != self._defaults.get(attr, None):
                    d[k] = v
        for k,attr in recursethese:
            v = getattr(self, attr).todict()
            if v:
                d[k] = v
        return d
    attrs['todict'] = todict

    def save(self):
        if not os.path.isdir(os.path.dirname(self._path)):
            os.mkdir(os.path.dirname(self._path))
        with open(self._path, 'w') as f:
            json.dump(self.todict(), f, indent=2)
    attrs['save'] = save

    attrs['__repr__'] = lambda self: repr(self.todict())
    attrs['__str__'] = lambda self: str(self.todict())

    return type(name, (object,), attrs)

Config = makeConfig('Config', CONFIG)

if __name__ == '__main__':
    import doctest
    doctest.testmod()
