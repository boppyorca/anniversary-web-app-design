import { describe, it, expect } from 'vitest'
import { getElapsed, normalizeDateInput } from '../lib/date'

describe('getElapsed', () => {
  it('computes 360 days at 2026-10-15T12:00:00+07:00', () => {
    const elapsed = getElapsed('2026-10-15T12:00:00+07:00')
    expect(elapsed.totalDays).toBe(360)
    expect(elapsed.isAtLeastOneYear).toBe(false)
  })

  it('computes 365 days at 2026-10-20T00:00:00+07:00', () => {
    const elapsed = getElapsed('2026-10-20T00:00:00+07:00')
    expect(elapsed.totalDays).toBe(365)
    expect(elapsed.isAtLeastOneYear).toBe(true)
  })
})

describe('normalizeDateInput', () => {
  it('normalizes slash-separated dates', () => {
    expect(normalizeDateInput('20/10/2025')).toBe('2025-10-20')
  })

  it('normalizes dash-separated dates', () => {
    expect(normalizeDateInput('20-10-2025')).toBe('2025-10-20')
  })

  it('normalizes dot-separated dates', () => {
    expect(normalizeDateInput('20.10.2025')).toBe('2025-10-20')
  })

  it('normalizes continuous 8-digit strings', () => {
    expect(normalizeDateInput('20102025')).toBe('2025-10-20')
  })

  it('normalizes 2010/2025 style 6-digit separated input after stripping non-digits', () => {
    expect(normalizeDateInput('2010/2025')).toBe('2025-10-20')
  })

  it('rejects invalid dates', () => {
    expect(normalizeDateInput('31/02/2025')).toBeNull()
    expect(normalizeDateInput('20/13/2025')).toBeNull()
    expect(normalizeDateInput('99/99/2025')).toBeNull()
    expect(normalizeDateInput('abcdefgh')).toBeNull()
    expect(normalizeDateInput('')).toBeNull()
    expect(normalizeDateInput('12/2025')).toBeNull()
  })
})
