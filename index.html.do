DEPS="sjcl/sjcl.min.js jquery/jquery-1.6.jso jquery.fkclip.jso jquery.postmsg.jso freekey.jso"
redo-ifchange $DEPS
cat head.tmpl > $3
for dep in $DEPS; do
    echo "<script type='text/javascript'>" >> $3
    cat $dep >> $3
    echo "</script>" >> $3
done
cat tail.tmpl >> $3

