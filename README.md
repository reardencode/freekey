FreeKey: It's freaky easy to manage your passwords.
=======================

FreeKey is an easy way to manage all of your passwords.

[Here're some blog posts I've written about FreeKey](http://reardencode.posterous.com/tag/freekey)

[If you want to talk about FreeKey, try the Google Group](http://groups.google.com/group/freekey-list)

[Click here](http://reardencode.github.com/freekey) to give FreeKey a try.

To build FreeKey from a git checkout, you just need Java (to run [Closure](http://code.google.com/closure/)) and Flex SDK 4.6 in your home directory, to build fkclip (I know, this is stupid, maybe I'll fix it some day).  Just checkout FreeKey and run either `redo` (if you have [apenwarr's redo](http://github.com/apenwarrredo) installed) or `build/do` .  The resulting index.html is a complete FreeKey, open it in your browser and have fun.

To use FreeKey, you need an Amazon S3 account and a bucket for it.  When you open FreeKey for the first time in any browser, you will be asked for your Amazon AWS credentials and S3 bucket.  This information is never sent to anyone, but is instead stored AES encrypted with your password in your browser's localStorage system.

I've recently adjusted the timeouts on FreeKey's sync behavior so that (unless the manual sync button is pressed) it may take up to 5 minutes for updates on one system to propogate to another.  This change was designed to bring two continuously running FreeKey clients under the usage level designated as "Free Tier" for Amazon S3 pricing.

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

 - Modern browser with localStorage (FreeKey will fall back to cookies if needed0 and GET/POST/PUT/DELETE ajax support
 - FreeKey uses SJCL and jQuery, both of these are included in the source
 repository for convenience.
