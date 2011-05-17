#!/bin/sh
cat head.tmpl > index.html

echo "<script type='text/javascript'>" >> index.html
cat jquery/jquery-1.6.min.js >> index.html
echo "</script>" >> index.html

echo "<script type='text/javascript'>" >> index.html
cat sjcl/sjcl.min.js >> index.html
echo "</script>" >> index.html

echo "<script type='text/javascript'>" >> index.html
echo '"use strict";' >> index.html
java -jar closure/compiler.jar --js jquery.postmsg.js >> index.html
echo "</script>" >> index.html

echo "<script type='text/javascript'>" >> index.html
echo '"use strict";' >> index.html
java -jar closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js freekey.js --externs freekey-externs.js >> index.html
#cat freekey.js >> index.html
echo "</script>" >> index.html

cat tail.tmpl >> index.html
