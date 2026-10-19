'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { content } from '@/content/content'
import { getElapsed } from '@/lib/date'
import { getPerfTier } from '@/lib/perf'
import { sendFinalReply, trackEvent } from '@/lib/api'

interface FinaleStageProps {
  onComplete: () => void
  onGoToStage?: (index: number) => void
  onResetJourney?: () => void
}

export function FinaleStage({
  onComplete,
  onGoToStage,
  onResetJourney,
}: FinaleStageProps) {
  const [totalDays, setTotalDays] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const elapsed = getElapsed(new Date(), content.counter.startDate)
    setTotalDays(elapsed.totalDays)
  }, [])

  // Canvas falling pastel confetti (capped at 60 particles, loops gently)
  useEffect(() => {
    if (reduceMotion || getPerfTier() === 'low') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const colors = ['#FFB8CC', '#AFCFF7', '#FFE3EC', '#DDEBFF', '#F27FA5', '#FFFBF8']
    const particleCount = 55
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 1.8 + 0.8,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      isStrip: Math.random() > 0.4,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 3,
    }))

    let animId: number
    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.vRot

        if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.75

        if (p.isStrip) {
          ctx.fillRect(-p.size, -p.size / 3, p.size * 2, p.size / 1.5)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [reduceMotion])

  // Focus trap & Esc handler for BottomSheet
  useEffect(() => {
    if (!sheetOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSheetOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sheetOpen])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || status === 'sending') return

    setStatus('sending')
    // Send optimistically
    sendFinalReply(message.trim())
    trackEvent('final_reply_sent', 'finale', { length: message.trim().length })

    setTimeout(() => {
      setStatus('sent')
      setTimeout(() => {
        setSheetOpen(false)
        setStatus('idle')
        setMessage('')
      }, 1400)
    }, 400)
  }

  return (
    <section
      className="relative w-full max-w-[430px] mx-auto min-h-[calc(100svh-100px)] flex flex-col items-center justify-center px-5 py-8 text-center"
      aria-labelledby="finale-title"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-5 w-full h-full"
        aria-hidden="true"
      />

      <header className="flex flex-col items-center gap-1 z-10 mb-4">
        <p className="eyebrow">{content.finale.eyebrow}</p>
        <h1 id="finale-title" className="sr-only">
          Lời kết hành trình kỷ niệm
        </h1>
      </header>

      {/* Hero Days Display */}
      <div className="my-8 flex flex-col items-center z-10">
        <span
          className="text-pink-500 font-display select-none tracking-tight leading-none drop-shadow-sm"
          style={{ fontSize: 'clamp(80px, 22vw, 116px)' }}
        >
          {totalDays}
        </span>
        <span className="font-hand text-ink text-2xl mt-1 tracking-wide">
          {content.finale.dayLabel}
        </span>
      </div>

      {/* Primary Action Button */}
      <div className="z-10 mt-6 flex flex-col items-center gap-4 w-full">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setSheetOpen(true)
            trackEvent('open_reply_sheet', 'finale')
          }}
          className="romantic-button romantic-button-primary w-full max-w-[280px]"
        >
          {content.finale.openSheetButton}
        </motion.button>

        {/* Small Navigation Actions */}
        <div className="flex items-center justify-center gap-5 mt-3">
          <button
            type="button"
            onClick={() => onGoToStage?.(5)}
            className="text-xs font-hand text-ink-soft hover:text-ink underline underline-offset-4 py-2 px-1"
          >
            {content.finale.replayFlipbook}
          </button>
          <span className="text-ink-soft/40 text-xs" aria-hidden="true">
            •
          </span>
          <button
            type="button"
            onClick={() => onResetJourney?.()}
            className="text-xs font-hand text-ink-soft hover:text-ink underline underline-offset-4 py-2 px-1"
          >
            {content.finale.replayStart}
          </button>
        </div>
      </div>

      {/* Reply Bottom Sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reply-sheet-title"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/40 backdrop-blur-xs cursor-pointer"
              onClick={() => setSheetOpen(false)}
              aria-hidden="true"
            />

            {/* Sheet Card */}
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 w-full max-w-[430px] mx-auto rounded-t-[32px] bg-cream p-6 shadow-2xl border-t border-white/60 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="reply-sheet-title"
                  className="font-display text-2xl text-ink"
                >
                  {content.finale.sheetTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-soft hover:text-ink rounded-full"
                  aria-label="Đóng bảng phản hồi"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSend}>
                <textarea
                  ref={textareaRef}
                  value={message}
                  maxLength={1000}
                  rows={5}
                  disabled={status !== 'idle'}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={content.finale.sheetPlaceholder}
                  className="w-full p-4 rounded-2xl border border-pink-300 bg-white/60 text-ink outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-300/40 resize-none text-sm font-vietnam leading-relaxed"
                  aria-label="Nội dung gửi lại cho anh"
                />

                <div className="flex items-center justify-between mt-2 text-xs text-ink-soft">
                  <span>{message.length}/1000</span>
                  {status === 'sent' && (
                    <span className="text-pink-500 font-semibold font-hand text-sm">
                      {content.finale.sheetSent}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={!message.trim() || status !== 'idle'}
                    className="romantic-button romantic-button-primary w-full"
                  >
                    {status === 'idle'
                      ? content.finale.sheetSubmit
                      : status === 'sending'
                        ? content.finale.sheetSending
                        : content.finale.sheetSent}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
