import { describe, it, expect, beforeEach, vi } from 'vitest'
import { STAGES, STAGE_IDS, loadProgress, saveProgress } from '../lib/progress'

const storageMap = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => {
    storageMap.set(key, String(val))
  },
  removeItem: (key: string) => {
    storageMap.delete(key)
  },
  clear: () => {
    storageMap.clear()
  },
}

describe('Feature: Stage Engine & Progress State (Tiến trình)', () => {
  beforeEach(() => {
    // @ts-expect-error polyfill for test
    globalThis.window = globalThis
    // @ts-expect-error polyfill for test
    globalThis.localStorage = mockLocalStorage
    mockLocalStorage.clear()
    vi.restoreAllMocks()
  })

  it('defines exactly 7 stages in fixed sequence', () => {
    expect(STAGE_IDS).toEqual([
      'gate',
      'counter',
      'video',
      'quiz',
      'timeline',
      'flipbook',
      'finale',
    ])
    expect(STAGES).toHaveLength(7)
    expect(STAGES.map((s) => s.id)).toEqual([...STAGE_IDS])
  })

  it('loads initial default state when storage is empty', () => {
    const state = loadProgress()
    expect(state).toEqual({ index: 0, unlocked: 0 })
  })

  it('saves and loads valid progress accurately', () => {
    saveProgress({ index: 3, unlocked: 4 })
    const loaded = loadProgress()
    expect(loaded).toEqual({ index: 3, unlocked: 4 })
  })

  it('clamps stage index so it does not exceed unlocked stage', () => {
    // If someone attempts to jump ahead of unlocked stage
    saveProgress({ index: 5, unlocked: 2 })
    const loaded = loadProgress()
    expect(loaded.index).toBe(2)
    expect(loaded.unlocked).toBe(2)
  })

  it('clamps values within bounds of total stages [0..6]', () => {
    saveProgress({ index: 99, unlocked: 99 })
    const loaded = loadProgress()
    expect(loaded.index).toBe(STAGES.length - 1)
    expect(loaded.unlocked).toBe(STAGES.length - 1)

    saveProgress({ index: -5, unlocked: -5 })
    const loadedNegative = loadProgress()
    expect(loadedNegative.index).toBe(0)
    expect(loadedNegative.unlocked).toBe(0)
  })

  it('safely handles corrupted storage without crashing', () => {
    localStorage.setItem('anniv:v1:progress', 'INVALID_JSON{{{')
    const loaded = loadProgress()
    expect(loaded).toEqual({ index: 0, unlocked: 0 })
  })
})
