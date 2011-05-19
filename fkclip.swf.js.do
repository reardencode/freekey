DEPS="fkclip.swf"
redo-ifchange $DEPS
echo "var fkclip = '\\" > $3
openssl base64 -in $DEPS|sed -e 's/$/\\/' >> $3
echo "';" >> $3
