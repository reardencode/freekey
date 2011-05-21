rm -f index.html
find build -mindepth 1 -maxdepth 1 -type f ! -name 'do' ! -name '*.do' -exec rm {} \;
