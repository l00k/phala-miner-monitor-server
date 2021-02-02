#!/bin/bash

npx mikro-orm migration:up

npm run api:dev &
API_PID=$!

while true; do
    # start api again
    ps -p $API_PID > /dev/null 2>&1
    if [[ $? != 0 ]]; then
    echo 'retry'
        npm run api:dev &
        API_PID=$!
    fi

    npm run crawler:dev
done
