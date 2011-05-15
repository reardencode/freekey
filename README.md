FreeKey: It's freaky easy to manage your passwords.
=======================

FreeKey is an easy way to manage all of your passwords.

[Here're some blog posts I've written about FreeKey](http://reardencode.posterous.com/tag/freekey)

[If you want to talk about FreeKey, try the Google Group](http://groups.google.com/group/freekey-list)

[Click here](http://reardencode.github.com/freekey) to give FreeKey a try.

To build FreeKey from a git checkout, you just need Java (to run [Closure](http://code.google.com/closure/)).  Just check it out and run ./build.sh .  The resulting index.html is a complete FreeKey, open it in your browser and have fun.

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
 - FreeKey uses SJCL and jQuery, both of these are included in the source
 repository for convenience.
