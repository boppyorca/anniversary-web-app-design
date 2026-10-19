import { describe, it, expect } from 'vitest'
import type { FlipbookPageMeta } from '../types/flipbook'

function getCardStyle(sheet: { kind: 'cover' | 'page' | 'notes' | 'back'; page?: FlipbookPageMeta }) {
  if (sheet.kind === 'page' && sheet.page) {
    const { width, height } = sheet.page
    const ratio = width / height

    if (Math.abs(ratio - 1) < 0.15) {
      // Square (1:1) -> Pages 1-3
      return {
        aspectRatio: '1 / 1',
        maxWidth: '350px',
        maxHeight: '62vh',
      }
    }
    if (ratio < 0.68) {
      // Tall / 9:16 -> Pages 4-6
      return {
        aspectRatio: '9 / 16',
        maxWidth: '330px',
        maxHeight: '68vh',
      }
    }
    // 4:5 or standard photo ratio -> Pages 7-15
    return {
      aspectRatio: `${width} / ${height}`,
      maxWidth: '350px',
      maxHeight: '64vh',
    }
  }

  // Cover, Notes, Back -> 4:5 card format
  return {
    aspectRatio: '4 / 5',
    maxWidth: '350px',
    maxHeight: '64vh',
  }
}

describe('Feature: Flipbook Adaptive Aspect Ratio (Thích ứng khung hình)', () => {
  it('assigns 1:1 square ratio for 880x880 pages (Group Red)', () => {
    const squarePage: FlipbookPageMeta = {
      index: 1,
      src: '/media/flipbook/p01.webp',
      width: 880,
      height: 880,
      group: 'red',
      sizeKB: 100,
      blur: 'data:image/webp;base64,mock',
    }

    const style = getCardStyle({ kind: 'page', page: squarePage })
    expect(style.aspectRatio).toBe('1 / 1')
  })

  it('assigns 9:16 tall ratio for 576x1024 or 720x1280 pages (Group Beige)', () => {
    const tallPage576: FlipbookPageMeta = {
      index: 4,
      src: '/media/flipbook/p04.webp',
      width: 576,
      height: 1024,
      group: 'beige',
      sizeKB: 90,
      blur: 'data:image/webp;base64,mock',
    }
    const tallPage720: FlipbookPageMeta = {
      index: 5,
      src: '/media/flipbook/p05.webp',
      width: 720,
      height: 1280,
      group: 'beige',
      sizeKB: 95,
      blur: 'data:image/webp;base64,mock',
    }

    expect(getCardStyle({ kind: 'page', page: tallPage576 }).aspectRatio).toBe('9 / 16')
    expect(getCardStyle({ kind: 'page', page: tallPage720 }).aspectRatio).toBe('9 / 16')
  })

  it('assigns 4:5 ratio for 880x1100 pages (Group Green, Black, Blue)', () => {
    const standardPage: FlipbookPageMeta = {
      index: 7,
      src: '/media/flipbook/p07.webp',
      width: 880,
      height: 1100,
      group: 'green',
      sizeKB: 110,
      blur: 'data:image/webp;base64,mock',
    }

    const style = getCardStyle({ kind: 'page', page: standardPage })
    expect(style.aspectRatio).toBe('880 / 1100')
  })

  it('assigns 4:5 ratio for Cover, Notes, and Back sheets', () => {
    expect(getCardStyle({ kind: 'cover' }).aspectRatio).toBe('4 / 5')
    expect(getCardStyle({ kind: 'notes' }).aspectRatio).toBe('4 / 5')
    expect(getCardStyle({ kind: 'back' }).aspectRatio).toBe('4 / 5')
  })
})
