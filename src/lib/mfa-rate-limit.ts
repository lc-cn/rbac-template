/** 固定 600s 桶起点（Unix 秒） */
export function rateLimitBucketStart(nowSec: number, windowSec: number): number {
  return Math.floor(nowSec / windowSec) * windowSec
}

export const MFA_RATE_WINDOW_SEC = 600
export const MFA_RATE_MAX_FAIL = 5
