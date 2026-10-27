# Grain Grid backend

The Express server serves the frontend and its `/api` endpoints from one origin.

```sh
cd Backend
npm install
npm start
```

Open `http://localhost:3000`. SQLite creates `data/grain.db` and seeds the demo listings on first startup.
The frontend uses demo user headers by default for local development. The
backend also exposes OTP endpoints; a production login UI and SMS provider
must be configured before disabling demo authentication with
`ALLOW_DEMO_AUTH=0`.
