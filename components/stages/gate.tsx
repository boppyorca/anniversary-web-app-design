'use client'

import React, { useState } from 'react'
import { content } from '@/content/content'
import { normalizeDateInput } from '@/lib/date'
import { verifySaltedDate } from '@/lib/hash'
import { trackEvent } from '@/lib/api'

interface GateProps {
  onComplete: () => void
}

export function GateStage({ onComplete }: GateProps) {
  const [value, setValue] = useState('')
  const [isWrong, setIsWrong] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isChecking || isSuccess) return

    const normalized = normalizeDateInput(value)
    if (!normalized) {
      triggerWrong()
      return
    }

    setIsChecking(true)
    try {
      const isValid = await verifySaltedDate(
        normalized,
        content.gate.salt,
        content.gate.answerHash
      )

      if (isValid) {
        setIsSuccess(true)
        setIsWrong(false)
        trackEvent('gate_unlock_success', 'gate', { attempts: wrongCount + 1 })
        setTimeout(() => {
          onComplete()
        }, 900)
      } else {
        triggerWrong()
      }
    } catch {
      triggerWrong()
    } finally {
      setIsChecking(false)
    }
  }

  function triggerWrong() {
    setIsWrong(true)
    const nextCount = wrongCount + 1
    setWrongCount(nextCount)
    const messageIndex = (nextCount - 1) % content.gate.wrongMessages.length
    setErrorMessage(content.gate.wrongMessages[messageIndex])
    trackEvent('gate_unlock_failed', 'gate', { attempt: nextCount })

    // Reset shake class after animation so next submit can shake again
    setTimeout(() => {
      setIsWrong(false)
    }, 450)
  }

  return (
    <section
      className={`gate-shell w-full ${isSuccess ? 'gate-success' : ''}`}
      aria-labelledby="gate-title"
    >
      <div className={`gate-content ${isSuccess ? 'is-success' : ''}`}>
        {!isSuccess && (
          <header className="gate-heading">
            <h1 id="gate-title">{content.gate.title}</h1>
            {wrongCount >= 3 && (
              <p className="gate-hint" role="status">
                {content.gate.hint}
              </p>
            )}
          </header>
        )}

        <form
          className={`gate-form ${isWrong ? 'is-wrong' : ''}`}
          onSubmit={handleSubmit}
        >
          <label className="date-field">
            <span className="sr-only">Nhập ngày kỷ niệm theo định dạng ngày tháng năm</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value}
              disabled={isSuccess}
              onChange={(e) => {
                setValue(e.target.value)
                if (errorMessage) setErrorMessage('')
              }}
              placeholder={content.gate.placeholder}
              aria-label="Ngày bắt đầu (dd/mm/yyyy)"
              aria-invalid={isWrong}
            />
          </label>

          {errorMessage && !isSuccess && (
            <p className="date-error" role="alert">
              {errorMessage}
            </p>
          )}

          {!isSuccess && (
            <button
              type="submit"
              disabled={!value.trim() || isChecking}
              className="romantic-button romantic-button-primary mt-2"
            >
              {isChecking ? 'Đang mở...' : content.gate.buttonText}
            </button>
          )}
        </form>

        {isSuccess && (
          <p className="success-message" role="status">
            {content.gate.successMessage}
          </p>
        )}
      </div>
    </section>
  )
}
