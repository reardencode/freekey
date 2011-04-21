import cmd, os
from getpass import getpass
from freekey.encryption_manager import EncryptionManager
from freekey.config import Config
from freekey.pack import PackFile
from freekey.passwords import hashpass, randompass

class Application:

    def __init__(self, basepath):
        self.em = EncryptionManager()
        self.config = Config(os.path.join(basepath, 'rc'))
        bm = __import__('freekey.backers', fromlist=[self.config.backer.clz])
        bc = getattr(bm, self.config.backer.clz)
        self.pack = PackFile(bc(**self.config.backer.fulldict()))
        if self.pack.get_key() and not self.config.usepwd:
            self.em.loadkey(self.pack.key)
            self.pack.init(self.em)

    def needs_auth(self):
        return self.pack.get_key()

    def needs_init(self):
        return not hasattr(self.em, 'key') and not self.pack.get_key()

    def keylist(self):
        return self.pack.pack.keys()

    def initialize(self, passphrase):
        self.em.newkey(passphrase or None)
        self.pack.init(self.em)

    def authenticate(self, passphrase):
        self.em.loadkey(self.pack.key, passphrase)
        self.pack.init(self.em)

    def __del__(self):
        self.close()

    def close(self):
        if self.pack:
            self.pack.close()
            self.pack = None

    def randompass(self):
        return randompass(
                self.config.length, self.config.chars, self.config.require)

    def hashpass(self, site, username, version):
        return hashpass(self.em, site, username, version,
                self.config.length, self.config.chars, self.config.require)

class PasswordCmd(cmd.Cmd):
    prompt = 'freekey.password: '

    def __init__(self, app, site, username, *args, **kw):
        cmd.Cmd.__init__(self, *args, **kw)
        self.app = app
        self.site = site
        self.username = username
        self.do_new('0')

    def do_new(self, version):
        passtype = self.app.config.type
        if passtype == 'hash':
            version = int(version)
            self.password = self.app.hashpass(self.site, self.username, version)
            print "New password: %s" % self.password
        elif passtype == 'random':
            self.password = self.app.randompass()
            print "New password: %s" % self.password
        elif passtype == 'manual':
            self.password = getpass("Enter password: ")
        else:
            raise Excpetion, "Invalid type, impossible"

    def do_save(self, _):
        self.app.pack.set((self.site, self.username), self.password)
        return True

    def do_cancel(self, _):
        return True


class ConfigCmd(cmd.Cmd):
    prompt = 'freekey.config: '

    def __init__(self, config, *args, **kw):
        cmd.Cmd.__init__(self, *args, **kw)
        self.config = config

    def do_print(self, _):
        print self.config

    def do_set(self, line):
        key, v = line.split('=', 1)
        ks = key.split('.')
        c = self.config
        for k in ks[:-1]:
            c = c[k]
        c[ks[-1]] = eval(v)

    def do_get(self, key):
        ks = key.split('.')
        c = self.config
        for k in ks[:-1]:
            c = c[k]
        print c[ks[-1]]

    def do_exit(self, _):
        print
        self.config.save()
        return True

    def do_EOF(self, _):
        return self.do_exit(_)

class FreeKeyCmd(cmd.Cmd):
    prompt = 'freekey: '
    intro = "Welcome to FreeKey! (type help for help)"

    def __init__(self, *args, **kw):
        cmd.Cmd.__init__(self, *args, **kw)
        self._reapp()

    def _reapp(self):
        if hasattr(self, 'app') and self.app: self.app.close()
        self.app = Application(os.path.join(os.environ['HOME'], '.freekey'))

    def onecmd(self, line):
        if not line or line.split(' ')[0] in ('exit', 'EOF', 'config', 'help'):
            return cmd.Cmd.onecmd(self, line)
        if not line.startswith('init') and self.app.needs_init():
            print "\nPlease run the init command first"
            return
        if not line.startswith('auth') and self.app.needs_auth():
            print "\nPlease run the auth command first"
            return
        return cmd.Cmd.onecmd(self, line)

    def do_new(self, line):
        '''new site [username]
-- Make a new password for the (site, username).
site: may not contain spaces, typically a domain or URL
username: optional, defaults to configured value (which may be empty)'''
        parts = line.split(' ')
        if not parts or len(parts) > 2:
            print "One or two arguments (site and username) expected"
            return
        site = parts[0]
        username = len(parts) > 1 and parts[1] or self.app.config.username
        PasswordCmd(self.app, site, username).cmdloop()

    def do_config(self, _):
        '''config
-- Enter the configuration interface.'''
        ConfigCmd(self.app.config).cmdloop()
        self._reapp()

    def do_list(self, _):
        '''list
-- Print the keys for all configured passwords.'''
        print '\n'.join('%40s %s' % k for k in self.app.keylist())

    def do_auth(self, _):
        '''auth
-- Authenticate with the repository.'''
        if not self.app.needs_auth():
            print "I don't need authentication"
        else:
            pw = None
            if self.app.config.usepwd:
                pw = getpass("Password: ")
            self.app.authenticate(pw)

    def do_get(self, line):
        '''get site [username]
-- Get the password for a (site, username)
site: may not contain spaces, typically a domain or URL
username: optional, defaults to configured value (which may be empty)'''
        parts = line.split(' ')
        if not parts or len(parts) > 2:
            print "One or two arguments (site and username) expected"
            return
        site = parts[0]
        username = len(parts) > 1 and parts[1] or self.app.config.username
        print self.app.pack.get((site, username))

    def do_init(self, _):
        '''init
-- Initialize a new repository.'''
        if not self.app.needs_init():
            print "Already initialized, remove all packs and try again"
        else:
            pw = None
            if self.app.config.usepwd:
                pw = getpass("Password: ")
            self.app.initialize(pw)
            print "Initialized"

    def do_exit(self, _):
        print
        if self.app:
            self.app.close()
            self.app = None
        return True

    def do_EOF(self, _):
        return self.do_exit(_)

if __name__ == '__main__':
    FreeKeyCmd().cmdloop()
