/**
 * Issue #8：敏感字段加密与限流 pepper（与 NEXTAUTH_SECRET 职责分离）。
 */
export function getSecretsEncryptionKeyHex(): string {
  const v = process.env.SECRETS_ENCRYPTION_KEY?.trim()
  if (!v) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('生产环境必须设置 SECRETS_ENCRYPTION_KEY（64 位十六进制，32 字节）')
    }
    return '0'.repeat(64)
  }
  if (!/^[0-9a-fA-F]{64}$/.test(v)) {
    throw new Error('SECRETS_ENCRYPTION_KEY 须为 64 位十六进制字符（32 字节）')
  }
  return v.toLowerCase()
}

export function getRateLimitPepperHex(): string {
  const v = process.env.RATE_LIMIT_PEPPER?.trim()
  if (!v) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('生产环境必须设置 RATE_LIMIT_PEPPER（64 位十六进制，32 字节）')
    }
    return '1'.repeat(64)
  }
  if (!/^[0-9a-fA-F]{64}$/.test(v)) {
    throw new Error('RATE_LIMIT_PEPPER 须为 64 位十六进制字符（32 字节）')
  }
  return v.toLowerCase()
}
