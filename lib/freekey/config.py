import json, os

allowed = set(('usepwd', 'type', 'path', 'chars', 'backer'))
defaults = {
        'usepwd': True,
        'type': 'random',
        'chars': {},
        'backer': { 'class': 'DiskBacker' }
        }

class Config:
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
    >>> try:
    ...     c.a = 'b'
    ...     c.a
    ... except ValueError:
    ...     pass
    >>> shutil.rmtree(p)
    '''

    def __init__(self, configpath):
        self.path = configpath
        if os.path.isfile(self.path):
            with open(self.path, 'r') as f:
                d = json.load(f)
                self.__dict__ = dict((k,v) for k,v in d.items() if k in allowed)

    def save(self):
        if not os.path.isdir(os.path.dirname(self.path)):
            os.mkdir(os.path.dirname(self.path))
        with open(self.path, 'w') as f:
            json.dump(self.__dict__, f)

    def __getattr__(self, attr):
        if attr in self.__dict__:
            return self.__dict__[attr]
        else:
            return defaults[attr]

    def __setattr__(self, attr, val):
        if attr in allowed:
            self.__dict__[attr] = val
        else:
            raise ValueError, '%s not allowed' % attr

if __name__ == '__main__':
    import doctest
    doctest.testmod()
