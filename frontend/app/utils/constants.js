export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : null) ||
  'http://localhost:8000/api'
