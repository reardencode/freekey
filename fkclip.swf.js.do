DEPS="fkclip.swf"
redo-ifchange $DEPS
echo "var fkclip = '\\"
openssl base64 -in $DEPS|sed -e 's/$/\\/'
echo "';"
