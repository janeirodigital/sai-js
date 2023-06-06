#!/usr/bin/env sh

envsubst < /service/deploy/config-template.json > /service/packages/service/config/config-prod.json

cd /service/packages/service/ || exit

npm start -- --config=config/config-prod.json

