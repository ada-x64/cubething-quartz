#!/bin/bash
npx dotenvx run -f "${DOTENV_FILE:-env/main.env}" -- npx quartz build "$@"
