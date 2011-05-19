redo-ifchange fkclip.as
~/flex_sdk_4.5/bin/mxmlc -static-link-runtime-shared-libraries \
    -optimize=true -debug=false -compress=true \
    -strict=true fkclip.as -output $3 1>&2
