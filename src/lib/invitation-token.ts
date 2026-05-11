import { createHash, randomBytes } from 'node:crypto'

export function hashInvitationToken(plain: string): string {
  return createHash('sha256').update(plain, 'utf8').digest('hex')
}

export function newInvitationPlainToken(): string {
  return randomBytes(24).toString('base64url')
}
