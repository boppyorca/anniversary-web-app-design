'use client'

import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { content } from '@/content/content'
import { saveAnswer, trackEvent } from '@/lib/api'

interface QuizStageProps {
  onComplete: () => void
}

export function QuizStage({ onComplete }: QuizStageProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answer, setAnswer] = useState('')
  const [revealingText, setRevealingText] = useState<string | null>(null)
  const [unlockedPieces, setUnlockedPieces] = useState<number[]>([]) // [0, 1, 2]
  const [isSubmitting, setIsSubmitting] = useState(false)
  const reduceMotion = useReducedMotion()

  const questions = content.quiz.questions
  const isAllAnswered = currentStep >= 3

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim() || isSubmitting) return

    const trimmed = answer.trim()
    setIsSubmitting(true)
    const qIndex = currentStep
    const question = questions[qIndex]

    // Save answer to API / offline queue
    saveAnswer(question.key, trimmed)
    trackEvent(`quiz_answer_${question.key}`, 'quiz', { length: trimmed.length })

    if (qIndex === 0) {
      // Q1: Show reveal text for 1.8s
      setRevealingText(question.revealText || 'Đáp án đúng: món gì cũng được, miễn là đi với em.')
      setTimeout(() => {
        setRevealingText(null)
        setUnlockedPieces((prev) => [...prev, 0])
        setAnswer('')
        setCurrentStep(1)
        setIsSubmitting(false)
      }, 1800)
    } else if (qIndex === 1) {
      // Q2: Show reaction text for 1.6s
      setRevealingText(question.reactionText || 'Anh ghi lại rồi nhé.')
      setTimeout(() => {
        setRevealingText(null)
        setUnlockedPieces((prev) => [...prev, 1])
        setAnswer('')
        setCurrentStep(2)
        setIsSubmitting(false)
      }, 1600)
    } else if (qIndex === 2) {
      // Q3: Show reaction text for 1.6s, then unlock piece 2 and complete
      setRevealingText(question.reactionText || 'Anh luôn yêu thương và ủng hộ em.')
      setTimeout(() => {
        setRevealingText(null)
        setUnlockedPieces((prev) => [...prev, 2])
        setAnswer('')
        setCurrentStep(3)
        setIsSubmitting(false)
        trackEvent('quiz_completed', 'quiz')
      }, 1600)
    }
  }

  const heartPath =
    'M 50 86 C 22 62 6 44 6 28 C 6 12 18 3 32 3 C 40 3 47 8 50 15 C 53 8 60 3 68 3 C 82 3 94 12 94 28 C 94 44 78 62 50 86 Z'

  return (
    <section
      className="quiz-content w-full max-w-[430px] mx-auto min-h-[calc(100svh-100px)] flex flex-col items-center justify-center px-5 py-6 text-center"
      aria-labelledby="quiz-heading"
    >
      <header className="sr-only">
        <h1 id="quiz-heading">Gắn kết yêu thương</h1>
      </header>

      {/* 3-Piece SVG Heart Display */}
      <div
        className="relative w-24 h-24 mb-4 flex items-center justify-center"
        aria-label={`Trái tim kỷ niệm: ${unlockedPieces.length}/3 mảnh ghép đã hoàn thành`}
        role="img"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Top-left lobe */}
            <clipPath id="heart-piece-0">
              <rect x="0" y="0" width="50" height="50" />
            </clipPath>
            {/* Top-right lobe */}
            <clipPath id="heart-piece-1">
              <rect x="50" y="0" width="50" height="50" />
            </clipPath>
            {/* Bottom point */}
            <clipPath id="heart-piece-2">
              <rect x="0" y="50" width="100" height="50" />
            </clipPath>
          </defs>

          {/* Background outline placeholder */}
          <path
            d={heartPath}
            fill="none"
            stroke="var(--pink-300)"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Piece 1: Left Lobe */}
          {unlockedPieces.includes(0) && (
            <motion.path
              d={heartPath}
              clipPath="url(#heart-piece-0)"
              fill="var(--pink-100)"
              stroke="var(--pink-500)"
              strokeWidth="2.5"
              initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            />
          )}

          {/* Piece 2: Right Lobe */}
          {unlockedPieces.includes(1) && (
            <motion.path
              d={heartPath}
              clipPath="url(#heart-piece-1)"
              fill="var(--blue-100)"
              stroke="var(--pink-500)"
              strokeWidth="2.5"
              initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            />
          )}

          {/* Piece 3: Bottom Point */}
          {unlockedPieces.includes(2) && (
            <motion.path
              d={heartPath}
              clipPath="url(#heart-piece-2)"
              fill="var(--pink-300)"
              stroke="var(--pink-500)"
              strokeWidth="2.5"
              initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            />
          )}

          {/* Whole Heart Pulse when all 3 complete */}
          {isAllAnswered && (
            <motion.path
              d={heartPath}
              fill="rgba(242, 127, 165, 0.25)"
              stroke="var(--pink-500)"
              strokeWidth="3"
              initial={{ scale: 1 }}
              animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </div>

      {/* Question Cards or Complete Screen */}
      {!isAllAnswered ? (
        <motion.form
          key={currentStep}
          onSubmit={handleSubmit}
          initial={reduceMotion ? false : { opacity: 0, x: 55 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 230, damping: 24 }}
          className="quiz-card w-full relative"
        >
          {/* Card Top Progress: 3 small segments */}
          <div
            className="flex items-center justify-center gap-1.5 mb-2"
            aria-label={`Câu hỏi ${currentStep + 1} trên 3`}
          >
            {[0, 1, 2].map((idx) => (
              <span
                key={idx}
                className={`h-1.5 w-7 rounded-full transition-colors duration-300 ${
                  idx <= currentStep ? 'bg-pink-500' : 'bg-pink-100'
                }`}
              />
            ))}
          </div>

          <p className="eyebrow">CÂU HỎI {currentStep + 1} / 3</p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight">
            {questions[currentStep].title}
          </h2>

          {/* Reveal or Reaction Banner */}
          {revealingText ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="my-4 p-4 rounded-2xl bg-pink-100/90 border border-pink-300 text-pink-500 font-hand text-base shadow-sm"
              role="status"
            >
              {revealingText}
            </motion.div>
          ) : (
            <>
              {/* Quick Chips for Q1 */}
              {currentStep === 0 && questions[0].chips && (
                <div className="quick-picks my-1" aria-label="Gợi ý món ăn">
                  {questions[0].chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={`quick-chip ${answer === chip ? 'is-selected' : ''}`}
                      onClick={() => setAnswer(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Input for Q1 or Textarea for Q2 & Q3 */}
              {currentStep === 0 ? (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={questions[0].placeholder}
                  className="quiz-input mt-2"
                  aria-label="Câu trả lời của em"
                  autoFocus
                />
              ) : (
                <div className="w-full mt-2">
                  <textarea
                    value={answer}
                    maxLength={500}
                    rows={4}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={questions[currentStep].placeholder}
                    className="quiz-input quiz-textarea"
                    aria-label="Câu trả lời của em"
                    autoFocus
                  />
                  <div className="flex justify-end text-xs text-ink-soft mt-1">
                    <span>{answer.length}/500</span>
                  </div>
                </div>
              )}

              <div className="quiz-card-footer mt-4">
                <span>
                  {currentStep === 0
                    ? 'Một câu ngắn thôi cũng được'
                    : 'Cứ viết thật lòng nhé'}
                </span>
                <button
                  type="submit"
                  disabled={!answer.trim() || isSubmitting}
                  className="romantic-button romantic-button-primary"
                >
                  {isSubmitting ? 'Đang gửi...' : content.quiz.submitButton}
                </button>
              </div>
            </>
          )}
        </motion.form>
      ) : (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="quiz-complete w-full"
        >
          <p className="eyebrow">{content.quiz.completeEyebrow}</p>
          <h2 className="font-display text-3xl text-ink mb-4">
            {content.quiz.completeTitle}
          </h2>
          <p className="font-hand text-ink-soft text-base mb-6">
            Mỗi câu trả lời đều là một mảnh ghép dịu dàng của hai đứa mình.
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="romantic-button romantic-button-primary"
          >
            {content.quiz.continueButton}
          </button>
        </motion.div>
      )}
    </section>
  )
}
