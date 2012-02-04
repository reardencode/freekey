F="../${1%\.*}.js"
redo-ifchange $F
java -jar closure/compiler.jar --js $F
