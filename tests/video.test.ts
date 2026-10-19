import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { content } from '../content/content'

describe('Feature: Video Stage (Thước phim)', () => {
  it('has valid video configuration with title and caption', () => {
    expect(content.video.title).toBeTruthy()
    expect(content.video.caption).toBeTruthy()
    expect(content.video.placeholderText).toBeTruthy()
  })

  it('sets skip timer to positive reasonable threshold (at least 3 seconds)', () => {
    expect(content.video.skipAfterSec).toBeGreaterThanOrEqual(3)
    expect(content.video.skipAfterSec).toBeLessThanOrEqual(30)
  })

  it('points to a valid poster image that exists on disk', () => {
    const posterRel = content.video.poster.replace(/^\//, '')
    const posterPath = path.resolve(__dirname, '..', 'public', posterRel)
    expect(fs.existsSync(posterPath)).toBe(true)
  })

  it('has non-empty source url or fallback', () => {
    expect(content.video.src).toBeTruthy()
  })
})
