redo-ifchange ../jquery/jquery.js ../jquery/jquery.ajaxbin.patch
cp ../jquery/jquery.js $3
patch $3 1>&2 < ../jquery/jquery.ajaxbin.patch 
