FreeKey: It's freaky easy to manage your passwords.
=======================

FreeKey is an easy way to manage all of your passwords.

[Here're some blog posts I've written about FreeKey](http://reardencode.posterous.com/tag/freekey)

[If you want to talk about FreeKey, try the Google Group](http://groups.google.com/group/freekey-list)


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
 - To build FreeKey from scratch requires a jQuery and SJCL.  For simplicity
   both of these dependencies are included in an intermediate file checked in.