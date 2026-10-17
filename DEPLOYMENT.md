# Production deployment on Render (one service)

The backend serves both the API and the built React app. The browser uses one origin for pages and API calls, so authentication stays in a first-party session cookie.

## Create the Render service

In Render, choose **New → Web Service**, select this repository and the branch to deploy, then configure:

- Root Directory: leave blank (Render then uses the repository root)
- Runtime: `Node`
- Build Command: `npm ci --prefix backend && npm ci --include=dev --prefix frontend && npm run build --prefix frontend`
- Start Command: `npm start --prefix backend`
- Health Check Path: `/api/health`

The frontend install includes dev dependencies because Vite is a build tool in `frontend/devDependencies`, while `NODE_ENV=production` is set for the service.

Add these environment variables to the Web Service:

- `NODE_VERSION=24.21.0`
- `NODE_ENV=production`
- `MONGODB` — MongoDB connection URI
- `SESSION_SECRET` — long random secret; keep the same value between deploys
- `TRUST_PROXY=true`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Render supplies `PORT`. Do not set it manually. In MongoDB Atlas, allow connections from the Render service if the database connection is rejected.

Do not set `VITE_API_URL`, `CLIENT_ORIGIN`, or `SESSION_COOKIE_SAME_SITE` for this deployment. The frontend uses relative `/api` URLs in production, CORS is enabled only for local development, and the production session cookie uses `SameSite=Lax`.

## Local development

Run the backend from `backend` with `npm run dev`, and the frontend from `frontend` with `npm run dev`. Local frontend requests use `http://localhost:3500` by default; local `.env` files are ignored by Git.

The production frontend build is created at `frontend/dist` during Render's build step. The backend serves that directory after its API routes and falls back to `index.html` for frontend routes.
