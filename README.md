freekey: It's freaky easy to manage your passwords.
=======================

freekey is intended to some day be an easy way to manage all of your
passwords.

        http://groups.google.com/groups/freekey-list


Design Goals
------------

 - Good security, but not paranoid
 - Portable simple storage format
 - Compatible with (at least) Linux and Mac
 - Hash (of user@domain + version), random, or manual passwords
 - Easy cloud backing (S3, Dropbox)
 - Simple GUI
 - Clipboard integration
 - Clean maintainable code
 - Tested code


Dependencies
------------

 - Python 2.7 (I think, does it run on lower versions?)
 - Pycrypto
 - Boto


What's Done
-----------

 - Some encryption stuff
 - Some password generation stuff
 - Some backer (storage disk/S3) stuff
 - Some storage format stuff
 - Some testing


What Needs Doing
----------------

 - GUI - I'm going to try creating one in Kivy soon
 - Security auditing by people who understand that better than me
 - Clipboard integration
 - Build/deploy/dependency stuff - I've never done this before
