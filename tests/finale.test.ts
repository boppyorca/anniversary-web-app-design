import { describe, it, expect } from 'vitest'
import { content } from '../content/content'

describe('Feature: Finale Stage (Lời nhắn gửi & Replay)', () => {
  it('provides all necessary labels for feedback bottom sheet', () => {
    expect(content.finale.openSheetButton).toBeTruthy()
    expect(content.finale.sheetTitle).toBeTruthy()
    expect(content.finale.sheetPlaceholder).toBeTruthy()
    expect(content.finale.sheetSubmit).toBeTruthy()
    expect(content.finale.sheetSending).toBeTruthy()
    expect(content.finale.sheetSent).toBeTruthy()
  })

  it('provides replay options for journey and flipbook', () => {
    expect(content.finale.replayFlipbook).toBeTruthy()
    expect(content.finale.replayStart).toBeTruthy()
  })

  it('maintains romantic tone: "anh" to "em", never "cậu"', () => {
    const finaleString = JSON.stringify(content.finale)
    expect(finaleString).not.toMatch(/\bcậu\b/i)
    expect(finaleString).toMatch(/\banh\b/i)
  })
})
