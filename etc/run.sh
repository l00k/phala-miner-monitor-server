#!/bin/bash

npm ci --only=production

npx mikro-orm migration:up

npm run api:prod &
API_PID=$!

while true; do
    # start api again
    ps -p $API_PID > /dev/null 2>&1
    if [[ $? != 0 ]]; then
        npm run api:prod &
        API_PID=$!
    fi

    npm run crawler:prod

    sleep 60
done
