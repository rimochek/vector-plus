# Telegram authentication and notifications

1. Revoke any bot token that has been shared outside the secret store and create a new token in BotFather.
2. Put the new value in `.env` as `TELEGRAM_BOT_TOKEN`. Never expose it as `NEXT_PUBLIC_*`.
3. Set `TELEGRAM_BOT_USERNAME` and generate a long random `TELEGRAM_WEBHOOK_SECRET`.
4. In BotFather, configure the production HTTPS domain and set the bot's Main Mini App URL to `https://YOUR_DOMAIN/login`.
5. Register the webhook after deployment:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
```

Use JSON fields `url=https://YOUR_API_DOMAIN/auth/telegram/webhook` and
`secret_token=<TELEGRAM_WEBHOOK_SECRET>`.

The browser only receives the public bot username. Mini App `initData` is
validated by the backend with a five-minute maximum age before a session is issued.
