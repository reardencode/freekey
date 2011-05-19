rm -f index.html
find build -type f ! -name 'do' ! -name '*.do' -mindepth 1 -maxdepth 1 -exec rm {} \;
