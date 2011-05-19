DEPS="sjcl/sjcl.min.js build/jquery.patched.jso build/jquery.fkclip.jso build/jquery.postmsg.jso build/freekey.jso"
redo-ifchange $DEPS
cat head.tmpl
for dep in $DEPS; do
    echo "<script type='text/javascript'>"
    cat $dep
    echo "</script>"
done
cat tail.tmpl

