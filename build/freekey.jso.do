DEPS="fkclip.swf.js freekey.js freekey-externs.js"
redo-ifchange $DEPS
java -jar closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS \
    --js fkclip.swf.js --js freekey.js --externs freekey-externs.js
