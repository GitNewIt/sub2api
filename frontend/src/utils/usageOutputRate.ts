import { textOutputTokens } from '@/utils/imageUsage'

type OutputRateRow = {
  output_tokens?: number | null
  image_output_tokens?: number | null
  duration_ms?: number | null
  first_token_ms?: number | null
}

/** 生成时长下限：短于 1s 时按 1s 计，避免首字后瞬间结束把速率算得异常偏高 */
const MIN_GENERATION_MS = 1000

/**
 * 输出速率（token/s）：文本输出 token 除以生成时长。
 * 有首字耗时时，生成时长 = 总耗时 - 首字；否则用总耗时。
 * 生成时长不足 1 秒时按 1 秒计。数据不足时返回 null，调用方不展示该行。
 */
export const calcOutputTokensPerSecond = (row: OutputRateRow | null | undefined): number | null => {
  if (!row) return null
  const tokens = textOutputTokens({
    output_tokens: row.output_tokens ?? 0,
    image_output_tokens: row.image_output_tokens ?? 0,
  })
  if (tokens <= 0) return null

  const durationMs = row.duration_ms
  if (durationMs == null || durationMs <= 0) return null

  // 有首字延迟时只统计“开始吐字之后”的时长，避免把排队/首包等待算进速率
  const firstTokenMs = row.first_token_ms
  const generationMs = firstTokenMs != null ? durationMs - firstTokenMs : durationMs
  if (generationMs <= 0) return null

  const tps = tokens / (Math.max(generationMs, MIN_GENERATION_MS) / 1000)
  return Number.isFinite(tps) ? tps : null
}

/** 固定一位小数，例如 83.8 t/s */
export const formatOutputTokensPerSecond = (tps: number | null | undefined): string | null => {
  if (tps == null || !Number.isFinite(tps)) return null
  return `${tps.toFixed(1)} t/s`
}

export const formatRowOutputTokensPerSecond = (row: OutputRateRow | null | undefined): string | null =>
  formatOutputTokensPerSecond(calcOutputTokensPerSecond(row))
