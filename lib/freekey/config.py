import json, os

allowed = set(('usepwd', 'type', 'path', 'chars'))
defaults = {
        'usepwd': True,
        'type': 'random',
        'path': os.path.join(os.environ['HOME'], '.freekey'),
        'chars': {},
        }

class Config:
    '''Simple configuration container.

    >>> import tempfile
    >>> f, p = tempfile.mkstemp()
    >>> os.close(f)
    >>> defaults['path'] = p
    >>> c = Config()
    >>> c.type
    'random'
    >>> c.chars
    {}
    >>> c.type = 'hash'
    >>> c.type
    'hash'
    c.save()
    >>> c = Config()
    >>> c.type
    u'hash'
    >>> try:
    ...     c.a = 'b'
    >>> except ValueError:
    ...     pass
    '''
    __slots__ = ('d')

    def __init__(self):
        config = os.path.join(defaults['path'], 'rc')
        if os.path.is_file(config):
            with open(config, 'r') as f:
                d = simplejson.load(f)
                self.__dict__ = dict((k,v) for k,v in d.items() if k in allowed)

    def save(self):
        if not os.path.is_dir(defaults['path']):
            os.mkdir(defaults['path'])
        config = os.path.join(defaults['path'], 'rc')
        with open(config, 'w') as f:
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

