import { createHash } from 'node:crypto'

/** RFC 7636：S256 code_challenge = BASE64URL(SHA256(code_verifier)) */
export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const digest = createHash('sha256').update(codeVerifier, 'utf8').digest('base64url')
  return digest === codeChallenge
}
