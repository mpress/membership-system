#!/usr/bin/env bash

NODEMON=$(npm list -g --depth=0 | grep beanz)
if [[ $NODEMON == *"nodemon"* ]]; then
	echo "$NODEMON"
	#DEBUG=express:* nodemon app.js
else
	CODE='\033[0;31m'
	NO_COLOUR='\033[0m'
	echo "You need to install nodemon to start this application.
Execute ${CODE}npm install -g nodemon${NO_COLOUR} and run this command again."
fi

