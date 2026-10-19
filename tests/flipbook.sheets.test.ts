import { describe, it, expect } from 'vitest'
import { buildSheets } from '../lib/flipbook'
import type { FlipbookPageMeta } from '../types/flipbook'

describe('buildSheets', () => {
  const mockPages: FlipbookPageMeta[] = Array.from({ length: 15 }, (_, i) => ({
    index: i + 1,
    src: `/media/flipbook/p${String(i + 1).padStart(2, '0')}.webp`,
    width: 880,
    height: 1100,
    group: 'green',
    sizeKB: 100,
    blur: 'data:image/webp;base64,mock',
  }))

  it('returns exactly 18 sheets', () => {
    const sheets = buildSheets({ pages: mockPages })
    expect(sheets).toHaveLength(18)
  })

  it('places cover first, notes second-to-last, and back last', () => {
    const sheets = buildSheets({ pages: mockPages })
    expect(sheets[0].kind).toBe('cover')
    expect(sheets[16].kind).toBe('notes')
    expect(sheets[17].kind).toBe('back')
  })

  it('places pages 1..15 in contiguous order from index 1 to 15', () => {
    const sheets = buildSheets({ pages: mockPages })
    for (let i = 1; i <= 15; i++) {
      const sheet = sheets[i]
      expect(sheet.kind).toBe('page')
      if (sheet.kind === 'page') {
        expect(sheet.page.index).toBe(i)
      }
    }
  })

  it('throws in dev if page count is not 15', () => {
    expect(() => buildSheets({ pages: mockPages.slice(0, 10) })).toThrow(/Expected exactly 18 sheets/)
  })
})
