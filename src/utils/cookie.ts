/**
 * Derives the cookie domain from a comma-separated list of CORS origins.
 * Returns undefined for localhost, IP addresses, or when no valid origin is found.
 *
 * Example: "https://api.example.com" → ".example.com"
 */
export function getCookieDomain(corsOrigins: string): string | undefined {
  for (const origin of corsOrigins.split(',')) {
    try {
      const { hostname } = new URL(origin.trim())
      if (hostname === 'localhost' || /^\d/.test(hostname)) continue
      const parts = hostname.split('.')
      if (parts.length >= 2) return '.' + parts.slice(-2).join('.')
    } catch {
      continue
    }
  }
  return undefined
}
