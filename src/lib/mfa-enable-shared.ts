import { randomBytes } from 'node:crypto'
import { generateBackupCodeSet, hashBackupCode } from '@/lib/mfa-backup-codes'
import { replaceUserBackupCodes } from '@/lib/security-data-access'

/** 开启 MFA 最后一步：写入 10 条备份码哈希，返回明文（仅当次展示） */
export async function issueMfaBackupCodes(userId: string): Promise<string[]> {
  const plain = generateBackupCodeSet()
  const salt = randomBytes(32).toString('hex')
  const hashes = plain.map((c) => hashBackupCode(c, userId, salt))
  await replaceUserBackupCodes(userId, hashes, salt)
  return plain
}
