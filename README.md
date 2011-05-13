freekey: It's freaky easy to manage your passwords.
=======================

freekey is an easy way to manage all of your passwords.

        http://groups.google.com/groups/freekey-list


Status
------

 - FreeKey in HTML5/Javascript is functional, but not complete.
 - Manual password entry works fine
 - Storage to S3 works fine
 - Synchronization between multiple clients works fine
 - Removing passwords works fine
 - The UI is usable
 - TODO: Ensure that the repo isn't locked before closing!
 - TODO: Ensure that changes are saved before closing
 - TODO: Random passwords
 - TODO: Hashed password mode (no S3)
 - TODO: (Maybe) Flash -> clipboard integration
 - TODO: Better UI
 - TODO: Automatic old-lock clearing?
 - TODO: Testing


Design Goals
------------

 - Good security, but not paranoid
 - Portable simple storage format
 - Hash (of user@domain + version), random, or manual passwords
 - S3 storage
 - Simple UI
 - Clipboard integration
 - Clean maintainable code


Dependencies
------------

 - Modern browser with localStorage and GET/POST/PUT/DELETE ajax support
