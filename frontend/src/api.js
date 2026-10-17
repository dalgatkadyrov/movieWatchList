const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

// On Render, the backend serves the built frontend from the same origin.
// Vite's local dev server still talks to the local backend on port 3500.
export const API_BASE = import.meta.env.PROD
  ? ''
  : (configuredApiUrl || 'http://localhost:3500').replace(/\/+$/, '')
