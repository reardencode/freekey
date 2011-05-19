DEPS="sjcl/sjcl.min.js jquery/jquery-1.6.jso jquery.fkclip.jso jquery.postmsg.jso freekey.jso"
redo-ifchange $DEPS
cat head.tmpl
for dep in $DEPS; do
    echo "<script type='text/javascript'>"
    cat $dep
    echo "</script>"
done
cat tail.tmpl

