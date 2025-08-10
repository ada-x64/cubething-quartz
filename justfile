deploy:
    npx dotenvx run -f "${DOTENV_FILE:-env/main.env}" -- npx quartz build "$@"

serve:
    npx dotenvx run -f "${DOTENV_FILE:-env/main.env}" -- npx quartz build "$@" --watch --serve
