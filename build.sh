#!/bin/sh
cat head.tmpl > index.html &&

echo "<script type='text/javascript'>" >> index.html &&
#cat jquery/jquery-1.6.min.js >> index.html &&
java -jar closure/compiler.jar --js jquery/jquery-1.6.js >> index.html &&
echo "</script>" >> index.html &&

echo "<script type='text/javascript'>" >> index.html &&
cat sjcl/sjcl.min.js >> index.html &&
echo "</script>" >> index.html &&

echo "<script type='text/javascript'>" >> index.html &&
echo '"use strict";' >> index.html &&
java -jar closure/compiler.jar --js jquery.postmsg.js >> index.html &&
echo "</script>" >> index.html &&

echo "<script type='text/javascript'>" >> index.html &&
echo '"use strict";' >> index.html &&
java -jar closure/compiler.jar --js jquery.fkclip.js >> index.html &&
echo "</script>" >> index.html &&

echo "<script type='text/javascript'>" >> index.html &&
echo '"use strict";' >> index.html &&
~/flex_sdk_4.5/bin/mxmlc -compiler.compress -static-link-runtime-shared-libraries fkclip.as &&
echo "var fkclip = \"\\" > fkclip.js &&
openssl base64 -in fkclip.swf|sed -e 's/$/\\/' >> fkclip.js &&
echo "\";" >> fkclip.js &&
java -jar closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js fkclip.js --js freekey.js --externs freekey-externs.js >> index.html &&
#cat freekey.js >> index.html
echo "</script>" >> index.html &&

cat tail.tmpl >> index.html
