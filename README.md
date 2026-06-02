# hsyoung.com

`hsyoung.com` is a split frontend/backend site:

- Frontend: Vite on port `3002`
- Backend API and asset server: Express on port `3003`

## Local development

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and fill in the real values.
3. Start both services with one command:
   `npm run dev`

Frontend runs on [http://127.0.0.1:3002](http://127.0.0.1:3002).
Backend runs on [http://127.0.0.1:3003](http://127.0.0.1:3003).

## Production

1. Install dependencies:
   `npm install`
2. Build the frontend:
   `npm run build`
3. Start frontend and backend together:
   `npm run start`

## systemd

Service template:

- [deploy/hsyoung.com.service](/D:/personal_website/deploy/hsyoung.com.service)

Typical install path on Linux:

1. Copy the service file to `/etc/systemd/system/hsyoung.com.service`
2. Reload systemd:
   `sudo systemctl daemon-reload`
3. Enable and start the service:
   `sudo systemctl enable --now hsyoung.com.service`

## Nginx

Reverse proxy template:

- [deploy/hsyoung.com.nginx.conf](/D:/personal_website/deploy/hsyoung.com.nginx.conf)

This routes:

- `hsyoung.com` to frontend `3002`
- `/api/*` to backend `3003`
- `/assets/*` to backend `3003`

Vite production bundles are emitted under `/static/*`, so they do not conflict with backend-served `/assets/*` files.
