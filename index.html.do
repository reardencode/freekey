JSDEPS="sjcl/sjcl.min.js build/fkclip.swf.jso build/jquery.patched.jso build/jquery.fkclip.jso build/jquery.postmsg.jso build/freekey.jso "
DEPS="$JSDEPS head.tmpl tail.tmpl"
redo-ifchange $DEPS
cat head.tmpl
for dep in $JSDEPS; do
    echo "<script type='text/javascript'>"
    cat $dep
    echo "</script>"
done
cat tail.tmpl

