# Deployment on Render

Create two Render services from the same Git repository. Render uses each service's root directory as the working directory for its commands.

## 1. Backend Web Service

In Render choose **New → Web Service**, select the repository and branch, then set:

- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Set these environment variables in the backend service:

- `NODE_VERSION=24.21.0`
- `NODE_ENV=production`
- `MONGODB` — MongoDB connection URI
- `SESSION_SECRET` — long random value
- `CLIENT_ORIGIN` — frontend Render URL, with no trailing slash (fill this after creating the Static Site)
- `SESSION_COOKIE_SAME_SITE=none`
- `TRUST_PROXY=true`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Render supplies `PORT`; do not hardcode it. The API binds to `0.0.0.0` and sets secure session cookies in production.

## 2. Frontend Static Site

Choose **New → Static Site**, select the same repository and branch, then set:

- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`

Add the build environment variable:

- `NODE_VERSION=24.21.0`
- `VITE_API_URL` — the backend service's public URL, e.g. `https://movie-watchlist-api.onrender.com`, with no trailing slash

In the Static Site's **Redirects/Rewrites** settings, add a rule:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

After Render creates the frontend URL, copy it into the backend's `CLIENT_ORIGIN` and redeploy the backend.

## Cookie and domain note

The frontend sends credentials and the backend enables credentialed CORS. `SameSite=None` is needed for unrelated frontend and backend sites, but browsers may restrict third-party cookies. If sign-in does not persist on the default Render domains, use custom domains under the same parent domain (for example `app.example.com` and `api.example.com`) and set `SESSION_COOKIE_SAME_SITE=lax`.

The frontend build intentionally fails if `VITE_API_URL` is missing. Vite embeds `VITE_*` values into the browser bundle, so never put secrets in them.

## Local setup

Use Node.js 22.12 or newer (or Node.js 20.19 or newer), as required by Vite 8 and Mongoose 9. [Vite](https://vite.dev/guide/), [Mongoose](https://mongoosejs.com/docs/migrating_to_9.html)

For local development, keep backend variables in `backend/.env` and frontend variables in `frontend/.env`. These files are ignored by the root `.gitignore`; set production values in each Render service's Environment settings. Local frontend development defaults to the API at `http://localhost:3500`.

The health endpoint is `GET /api/health`; it returns success only when MongoDB is connected. If MongoDB Atlas rejects the connection, make sure its Network Access rules allow connections from the backend service.
