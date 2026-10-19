import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import manifest from '../content/flipbook.manifest.json'

describe('flipbook.manifest.json verification', () => {
  it('has total === 15', () => {
    expect(manifest.total).toBe(15)
    expect(manifest.pages).toHaveLength(15)
  })

  it('has indexes exactly 1..15 in contiguous order', () => {
    manifest.pages.forEach((page, i) => {
      expect(page.index).toBe(i + 1)
    })
  })

  it('has groups in order: red x3, beige x3, green x4, black x4, blue x1', () => {
    const expectedGroups = [
      'red', 'red', 'red',
      'beige', 'beige', 'beige',
      'green', 'green', 'green', 'green',
      'black', 'black', 'black', 'black',
      'blue',
    ]

    const actualGroups = manifest.pages.map((p) => p.group)
    expect(actualGroups).toEqual(expectedGroups)
  })

  it('has width and height as positive integers', () => {
    manifest.pages.forEach((page) => {
      expect(Number.isInteger(page.width)).toBe(true)
      expect(page.width).toBeGreaterThan(0)
      expect(Number.isInteger(page.height)).toBe(true)
      expect(page.height).toBeGreaterThan(0)
    })
  })

  it('has no duplicate src paths', () => {
    const srcList = manifest.pages.map((p) => p.src)
    const unique = new Set(srcList)
    expect(unique.size).toBe(srcList.length)
  })

  it('has each src file existing on disk and <= 200 KB', () => {
    const rootDir = path.resolve(__dirname, '..')
    let totalBytes = 0

    manifest.pages.forEach((page) => {
      const fullPath = path.join(rootDir, 'public', page.src.replace(/^\//, ''))
      expect(fs.existsSync(fullPath)).toBe(true)

      const stats = fs.statSync(fullPath)
      const sizeKB = Math.round(stats.size / 1024)
      totalBytes += stats.size

      expect(sizeKB).toBeLessThanOrEqual(200)
    })

    // Total size <= 3.2 MB (3276.8 KB)
    const totalMB = totalBytes / (1024 * 1024)
    expect(totalMB).toBeLessThanOrEqual(3.2)
  })

  it('has valid blur placeholder data URLs', () => {
    manifest.pages.forEach((page) => {
      expect(page.blur).toMatch(/^data:image\/webp;base64,/)
    })
  })
})
