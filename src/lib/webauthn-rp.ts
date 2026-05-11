/**
 * RP ID / Origin 与站点 URL 对齐（生产单一域名；开发 localhost）。
 */
export function getAppBaseUrl(): string {
  const u = process.env.NEXTAUTH_URL?.trim() || process.env.AUTH_URL?.trim()
  if (u) return u.replace(/\/$/, '')
  return 'http://localhost:3000'
}

export function getWebAuthnRpId(): string {
  try {
    return new URL(getAppBaseUrl()).hostname
  } catch {
    return 'localhost'
  }
}

export function getWebAuthnExpectedOrigin(): string {
  try {
    return new URL(getAppBaseUrl()).origin
  } catch {
    return 'http://localhost:3000'
  }
}
