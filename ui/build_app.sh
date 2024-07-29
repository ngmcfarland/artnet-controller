#!/bin/bash

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

npm run build

sudo rm -r /var/www/html
sudo cp -r $SCRIPTPATH/dist /var/www/html
