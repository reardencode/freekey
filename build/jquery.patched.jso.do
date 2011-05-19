F="${1%\.*}"
redo-ifchange $F.js
java -jar closure/compiler.jar --js $F.js
