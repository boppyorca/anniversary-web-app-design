import { describe, it, expect } from 'vitest'
import { parsePageNumber } from '../scripts/build-flipbook.mjs'

describe('Numeric-sort page number parsing in build-flipbook.mjs', () => {
  it('parses various naming formats correctly', () => {
    expect(parsePageNumber('p-2.png')).toBe(2)
    expect(parsePageNumber('p-10.png')).toBe(10)
    expect(parsePageNumber('p-01.png')).toBe(1)
    expect(parsePageNumber('page-15.webp')).toBe(15)
    expect(parsePageNumber('p09.webp')).toBe(9)
    expect(parsePageNumber('p12.png')).toBe(12)
    expect(parsePageNumber('page_7.jpg')).toBe(7)
    expect(parsePageNumber('trang-6.jpg')).toBe(6)
    expect(parsePageNumber('06.jpg')).toBe(6)
    expect(parsePageNumber('image_10.png')).toBe(10)
    expect(parsePageNumber('photo_15.jpeg')).toBe(15)
  })

  it('sorts filenames numerically instead of alphabetically', () => {
    const unsorted = ['p-10.png', 'p-2.png', 'p-01.png', 'p-15.png', 'p-3.png']

    // Alphabetical sort would place p-10 before p-2
    const alphabetical = [...unsorted].sort()
    expect(alphabetical[0]).toBe('p-01.png')
    expect(alphabetical[1]).toBe('p-10.png') // Note: p-10 comes before p-2 alphabetically!

    // Numeric sort by parsed integer page number
    const numericSorted = [...unsorted].sort(
      (a, b) => (parsePageNumber(a) ?? 0) - (parsePageNumber(b) ?? 0)
    )

    expect(numericSorted).toEqual([
      'p-01.png',
      'p-2.png',
      'p-3.png',
      'p-10.png',
      'p-15.png',
    ])
  })

  it('returns null for non-matching filenames', () => {
    expect(parsePageNumber('manifest.json')).toBeNull()
    expect(parsePageNumber('readme.txt')).toBeNull()
    expect(parsePageNumber('.DS_Store')).toBeNull()
    expect(parsePageNumber('media_1792057418040.jpg')).toBeNull()
  })
})
