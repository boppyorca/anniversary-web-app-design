'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { content } from '@/content/content'
import { getElapsed, type ElapsedTime } from '@/lib/date'
import { getPerfTier } from '@/lib/perf'

interface CounterProps {
  onComplete: () => void
}

export function CounterStage({ onComplete }: CounterProps) {
  const [elapsed, setElapsed] = useState<ElapsedTime>(() =>
    getElapsed(new Date(), content.counter.startDate)
  )
  const [displayDays, setDisplayDays] = useState(0)
  const [isCountingFinished, setIsCountingFinished] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const reduceMotion = useReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 1. Count-up animation for days over 1.6s
  useEffect(() => {
    const targetDays = elapsed.totalDays

    if (reduceMotion) {
      setDisplayDays(targetDays)
      setIsCountingFinished(true)
      if (targetDays >= 365) setShowConfetti(true)
      return
    }

    const duration = 1600
    const start = performance.now()

    let frameId: number
    const animateCount = (now: number) => {
      const time = Math.min(1, (now - start) / duration)
      // Ease out cubic
      const progress = 1 - Math.pow(1 - time, 3)
      const current = Math.floor(progress * targetDays)
      setDisplayDays(current)

      if (time < 1) {
        frameId = requestAnimationFrame(animateCount)
      } else {
        setDisplayDays(targetDays)
        setIsCountingFinished(true)
        if (targetDays >= 365) setShowConfetti(true)
      }
    }

    frameId = requestAnimationFrame(animateCount)
    return () => cancelAnimationFrame(frameId)
  }, [elapsed.totalDays, reduceMotion])

  // 2. Second-by-second ticker paused when document.hidden
  useEffect(() => {
    const updateTicker = () => {
      if (document.hidden) return
      setElapsed(getElapsed(new Date(), content.counter.startDate))
    }

    const timer = setInterval(updateTicker, 1000)
    return () => clearInterval(timer)
  }, [])

  // 3. Canvas confetti burst when days >= 365
  useEffect(() => {
    if (!showConfetti || reduceMotion || getPerfTier() === 'low') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.parentElement?.clientWidth || 390
    canvas.height = canvas.parentElement?.clientHeight || 600

    const colors = ['#FFB8CC', '#AFCFF7', '#FFE3EC', '#DDEBFF', '#F27FA5']
    const particles = Array.from({ length: 50 }, () => ({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 40,
      y: canvas.height * 0.38,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 6 - 3,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      isStrip: Math.random() > 0.5,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      alpha: 1,
    }))

    let animId: number
    let startTime = performance.now()

    const render = (now: number) => {
      const elapsedMs = now - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15 // gravity
        p.rotation += p.vRot
        p.alpha = Math.max(0, 1 - elapsedMs / 2500)

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color

        if (p.isStrip) {
          ctx.fillRect(-p.size, -p.size / 3, p.size * 2, p.size / 1.5)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })

      if (elapsedMs < 2500) {
        animId = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [showConfetti, reduceMotion])

  return (
    <section
      className="relative w-full max-w-[430px] mx-auto min-h-[calc(100svh-100px)] flex flex-col items-center justify-center px-5 py-8 text-center"
      aria-labelledby="counter-title"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 w-full h-full"
        aria-hidden="true"
      />

      <header className="flex flex-col items-center gap-1 z-20">
        <p className="eyebrow">{content.counter.eyebrow}</p>
        <h1 id="counter-title" className="sr-only">
          Số ngày chúng mình đã bên nhau
        </h1>
      </header>

      {/* Hero Day Counter */}
      <div className="my-6 flex flex-col items-center z-20" aria-live="polite">
        <span
          className="text-pink-500 font-display select-none tracking-tight leading-none drop-shadow-sm"
          style={{ fontSize: 'clamp(84px, 24vw, 120px)' }}
        >
          {displayDays}
        </span>
        <span className="font-hand text-ink text-2xl mt-1 tracking-wide">
          {content.counter.dayLabel}
        </span>

        {elapsed.totalDays >= 365 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-pink-100/90 border border-pink-300 px-4 py-1.5 shadow-sm"
          >
            <span className="font-hand text-sm font-semibold text-pink-500">
              {content.counter.anniversaryNotice}
            </span>
          </motion.div>
        )}
      </div>

      {/* Clock Cells: giờ, phút, giây */}
      <div
        className="grid grid-cols-3 gap-3 w-full max-w-[320px] my-4 z-20"
        aria-label="Thời gian chi tiết"
      >
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cream/80 border border-pink-100/80 shadow-[0_8px_20px_rgba(218,133,163,0.12)]">
          <span className="font-vietnam font-bold text-2xl text-ink">
            {String(elapsed.hours).padStart(2, '0')}
          </span>
          <span className="font-hand text-xs text-ink-soft mt-0.5">
            {content.counter.hourLabel}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cream/80 border border-pink-100/80 shadow-[0_8px_20px_rgba(218,133,163,0.12)]">
          <span className="font-vietnam font-bold text-2xl text-ink">
            {String(elapsed.minutes).padStart(2, '0')}
          </span>
          <span className="font-hand text-xs text-ink-soft mt-0.5">
            {content.counter.minuteLabel}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cream/80 border border-pink-100/80 shadow-[0_8px_20px_rgba(218,133,163,0.12)]">
          <span className="font-vietnam font-bold text-2xl text-pink-500">
            {String(elapsed.seconds).padStart(2, '0')}
          </span>
          <span className="font-hand text-xs text-ink-soft mt-0.5">
            {content.counter.secondLabel}
          </span>
        </div>
      </div>

      {/* Continue button fading in after count-up ends */}
      <div className="min-h-[56px] mt-6 flex items-center justify-center z-20">
        {isCountingFinished && (
          <motion.button
            type="button"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="romantic-button romantic-button-primary"
          >
            {content.counter.continueButton}
          </motion.button>
        )}
      </div>
    </section>
  )
}
