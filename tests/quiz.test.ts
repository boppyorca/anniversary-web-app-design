import { describe, it, expect } from 'vitest'
import { content } from '../content/content'

describe('Feature: Quiz Stage (Gắn kết & Trắc nghiệm)', () => {
  it('contains exactly 3 interactive questions in sequence', () => {
    expect(content.quiz.questions).toHaveLength(3)
    expect(content.quiz.questions.map((q) => q.key)).toEqual(['q1', 'q2', 'q3'])
  })

  it('configures Q1 as chips-text with choices and romantic reveal text', () => {
    const q1 = content.quiz.questions[0]
    expect(q1.type).toBe('chips-text')
    expect(q1.chips).toBeDefined()
    expect(q1.chips!.length).toBeGreaterThanOrEqual(3)
    expect(q1.revealText).toBeTruthy()
  })

  it('configures Q2 and Q3 as textareas with max character limits', () => {
    const q2 = content.quiz.questions[1]
    const q3 = content.quiz.questions[2]

    expect(q2.type).toBe('textarea')
    expect(q2.maxLength).toBe(500)
    expect(q2.reactionText).toBeTruthy()

    expect(q3.type).toBe('textarea')
    expect(q3.maxLength).toBe(500)
    expect(q3.reactionText).toBeTruthy()
  })

  it('strictly adheres to voice: speaks as "anh" to "em", never "cậu"', () => {
    const quizString = JSON.stringify(content.quiz)
    expect(quizString).not.toMatch(/\bcậu\b/i)
    expect(quizString).toMatch(/\bem\b/i)
  })
})
