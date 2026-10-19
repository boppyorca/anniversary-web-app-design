import { describe, it, expect } from 'vitest'
import { content } from '../content/content'

describe('Feature: Timeline Stage (Chặng đường kỷ niệm)', () => {
  it('contains at least 4 milestone items', () => {
    expect(content.timeline.items.length).toBeGreaterThanOrEqual(4)
  })

  it('verifies all timeline items have required fields and valid dateISO', () => {
    content.timeline.items.forEach((item) => {
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(item.body).toBeTruthy()
      expect(item.displayDate).toBeTruthy()
      expect(item.dateISO).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(item.dateISO))).toBe(false)
    })
  })

  it('has valid date timestamps for all timeline items', () => {
    content.timeline.items.forEach((item) => {
      const timestamp = new Date(item.dateISO).getTime()
      expect(Number.isFinite(timestamp)).toBe(true)
    })
  })

  it('has continueButton text defined', () => {
    expect(content.timeline.continueButton).toBeTruthy()
  })
})
