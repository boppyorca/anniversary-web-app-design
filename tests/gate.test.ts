import { describe, it, expect } from 'vitest'
import { sha256, verifySaltedDate } from '../lib/hash'
import { normalizeDateInput } from '../lib/date'
import { content } from '../content/content'

describe('Feature: Gate Stage (Mở khóa)', () => {
  it('computes correct SHA-256 for standard test string', async () => {
    // Standard SHA-256 of "hello"
    const hash = await sha256('hello')
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
  })

  it('correctly verifies the anniversary date 20/10/2025 against content.gate', async () => {
    const input = '20/10/2025'
    const normalized = normalizeDateInput(input)
    expect(normalized).toBe('2025-10-20')

    const isValid = await verifySaltedDate(
      normalized!,
      content.gate.salt,
      content.gate.answerHash
    )
    expect(isValid).toBe(true)
  })

  it('verifies anniversary date with various delimiters (dots, dashes, raw digits)', async () => {
    const variations = ['20-10-2025', '20.10.2025', '20102025', ' 20/10/2025 ']
    for (const v of variations) {
      const normalized = normalizeDateInput(v)
      expect(normalized).toBe('2025-10-20')
      const isValid = await verifySaltedDate(
        normalized!,
        content.gate.salt,
        content.gate.answerHash
      )
      expect(isValid).toBe(true)
    }
  })

  it('rejects incorrect anniversary dates', async () => {
    const wrongDates = ['19/10/2025', '21/10/2025', '20/11/2025', '20/10/2024']
    for (const d of wrongDates) {
      const normalized = normalizeDateInput(d)
      const isValid = await verifySaltedDate(
        normalized!,
        content.gate.salt,
        content.gate.answerHash
      )
      expect(isValid).toBe(false)
    }
  })

  it('provides helpful wrong messages and hints in gate content', () => {
    expect(content.gate.wrongMessages.length).toBeGreaterThanOrEqual(3)
    expect(content.gate.hint).toBeTruthy()
    expect(content.gate.buttonText).toBeTruthy()
  })
})
