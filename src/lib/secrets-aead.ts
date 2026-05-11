import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { getSecretsEncryptionKeyHex } from './secrets-env.ts'

const ALG = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function keyBuf(): Buffer {
  return Buffer.from(getSecretsEncryptionKeyHex(), 'hex')
}

/** AEAD 密文：hex(iv|tag|ciphertext)，可选 AAD 参与校验 */
export function sealSecret(plain: string, aad?: string): string {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALG, keyBuf(), iv, { authTagLength: TAG_LEN })
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'))
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('hex')
}

export function openSecret(sealedHex: string, aad?: string): string {
  const raw = Buffer.from(sealedHex, 'hex')
  if (raw.length < IV_LEN + TAG_LEN + 1) throw new Error('invalid_sealed')
  const iv = raw.subarray(0, IV_LEN)
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const enc = raw.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALG, keyBuf(), iv, { authTagLength: TAG_LEN })
  if (aad) decipher.setAAD(Buffer.from(aad, 'utf8'))
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
