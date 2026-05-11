import { createHash, randomInt } from 'node:crypto'

/** Base32 去易混：不含 0 O 1 I L */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LEN = 16
export const BACKUP_CODE_COUNT = 10

export function generateBackupCode(): string {
  let s = ''
  for (let i = 0; i < CODE_LEN; i++) {
    s += ALPHABET[randomInt(ALPHABET.length)]!
  }
  return s
}

export function generateBackupCodeSet(): string[] {
  const set = new Set<string>()
  while (set.size < BACKUP_CODE_COUNT) {
    set.add(generateBackupCode())
  }
  return [...set]
}

export function normalizeBackupCodeInput(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

export function hashBackupCode(code: string, userId: string, salt: string): string {
  const norm = normalizeBackupCodeInput(code)
  return createHash('sha256')
    .update(salt, 'utf8')
    .update('|', 'utf8')
    .update(userId, 'utf8')
    .update('|', 'utf8')
    .update(norm, 'utf8')
    .digest('hex')
}
