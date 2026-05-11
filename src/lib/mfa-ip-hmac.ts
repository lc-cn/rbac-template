import { createHmac } from 'node:crypto'
import { getRateLimitPepperHex } from './secrets-env.ts'

export function mfaRateLimitIpKey(ip: string): string {
  const h = createHmac('sha256', Buffer.from(getRateLimitPepperHex(), 'hex'))
  h.update(ip || 'unknown')
  return `mfa:ip:${h.digest('hex')}`
}
