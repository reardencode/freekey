DEPS="../freekey.js ../freekey-externs.js ../jquery/jquery-externs.js"
redo-ifchange $DEPS
java -jar closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS \
    --js ../freekey.js --externs ../freekey-externs.js --externs ../jquery/jquery-externs.js
