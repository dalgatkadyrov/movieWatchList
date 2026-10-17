const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error('Set VITE_API_URL to your deployed backend URL before building the frontend.')
}

export const API_BASE = (configuredApiUrl || 'http://localhost:3500').replace(/\/+$/, '')
