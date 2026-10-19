export type PerfTier = 'high' | 'low'

export function getPerfTier(): PerfTier {
  if (typeof window === 'undefined') return 'high'

  try {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return 'low'

    const concurrency = navigator.hardwareConcurrency
    if (typeof concurrency === 'number' && concurrency <= 4) return 'low'

    const nav = navigator as unknown as { deviceMemory?: number }
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4) return 'low'
  } catch {
    return 'high'
  }

  return 'high'
}
