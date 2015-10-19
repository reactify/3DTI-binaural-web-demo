# TOOLS
BIN = node_modules/.bin
BROWSERIFY = ${BIN}/browserify
SASS = ${BIN}/node-sass
COFFEE = ${BIN}/coffee
SERVER = ${BIN}/http-server

# PATHS
JS=public/
SHARED=../../148\ Monotype\ Web\ Shared

# CONFIG
SERVER_PORT = 8088
FLAGS="--debug"

MAIN_IN = src/main.coffee
MAIN_OUT = ${JS}/server.js

# vars

COMPILER_FLAGS =

default: build

clean:
	rm ${MAIN_OUT}
	rm -R deploy

sass:
	${SASS} ${SASS_IN} ${SASS_OUT}


build:
	coffeeify ${MAIN_IN} ${FLAGS} > ${MAIN_OUT}

