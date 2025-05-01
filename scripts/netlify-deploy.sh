#!/bin/bash
git config --global url."git@github.com:".insteadOf https://github.com/
git config --global url."git://".insteadOf https://

npx dotenv -f $DOTENV_FILE -- quartz build
