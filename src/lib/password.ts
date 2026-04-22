import bcrypt from 'bcryptjs'

/** 与数据库中存储形式一致：bcrypt 串或历史明文（如种子数据） */
export function verifyStoredPassword(stored: string | null | undefined, plain: string): boolean {
  if (!stored) return false
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compareSync(plain, stored)
  }
  return stored === plain
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10)
}
