import { describe, expect, it } from 'vitest'

import {
  calcOutputTokensPerSecond,
  formatOutputTokensPerSecond,
  formatRowOutputTokensPerSecond,
} from '@/utils/usageOutputRate'

describe('usageOutputRate', () => {
  it('uses generation time after first token', () => {
    // 截图口径：首字 3.63s、总耗时 7.92s、输出 359 token → 83.8 t/s
    expect(calcOutputTokensPerSecond({
      output_tokens: 359,
      first_token_ms: 3630,
      duration_ms: 7920,
    })).toBeCloseTo(83.68298, 4)
    expect(formatRowOutputTokensPerSecond({
      output_tokens: 359,
      first_token_ms: 3630,
      duration_ms: 7920,
    })).toBe('83.7 t/s')
  })

  it('falls back to total duration when first token is missing', () => {
    expect(calcOutputTokensPerSecond({
      output_tokens: 100,
      duration_ms: 2000,
    })).toBe(50)
    expect(formatOutputTokensPerSecond(50)).toBe('50.0 t/s')
  })

  it('excludes image output tokens from the rate', () => {
    expect(calcOutputTokensPerSecond({
      output_tokens: 120,
      image_output_tokens: 20,
      duration_ms: 2000,
    })).toBe(50)
  })

  it('floors generation time below 1s to 1s', () => {
    // 首字 23.81s、总耗时 24.05s、输出 921 token：间隔 0.24s 若按真实间隔会到 3800+ t/s
    expect(calcOutputTokensPerSecond({
      output_tokens: 921,
      first_token_ms: 23810,
      duration_ms: 24050,
    })).toBe(921)
    expect(formatRowOutputTokensPerSecond({
      output_tokens: 921,
      first_token_ms: 23810,
      duration_ms: 24050,
    })).toBe('921.0 t/s')
  })

  it('returns null when tokens or generation time are missing', () => {
    expect(calcOutputTokensPerSecond({
      output_tokens: 0,
      duration_ms: 2000,
    })).toBeNull()
    expect(calcOutputTokensPerSecond({
      output_tokens: 10,
      duration_ms: 0,
    })).toBeNull()
    expect(calcOutputTokensPerSecond({
      output_tokens: 10,
      first_token_ms: 3000,
      duration_ms: 3000,
    })).toBeNull()
    expect(formatRowOutputTokensPerSecond(null)).toBeNull()
  })
})
