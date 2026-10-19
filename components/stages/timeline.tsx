'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { content } from '@/content/content'

interface TimelineStageProps {
  onComplete: () => void
}

export function TimelineStage({ onComplete }: TimelineStageProps) {
  const [progress, setProgress] = useState(0)
  const reduceMotion = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number | null = null
    let ticking = false

    function updateProgress() {
      const track = trackRef.current
      if (!track) {
        ticking = false
        return
      }
      const bounds = track.getBoundingClientRect()
      const viewport = window.innerHeight
      const distance = Math.max(track.offsetHeight - viewport * 0.48, 1)
      const ratio = Math.min(1, Math.max(0, (viewport * 0.52 - bounds.top) / distance))
      setProgress(ratio)
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        rafId = requestAnimationFrame(updateProgress)
      }
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  const items = content.timeline.items

  return (
    <section
      className="timeline-content w-full max-w-[430px] mx-auto px-5 py-6"
      aria-labelledby="timeline-title"
    >
      <header className="text-center mb-8">
        <p className="eyebrow">{content.timeline.eyebrow}</p>
        <h1 id="timeline-title">{content.timeline.title}</h1>
      </header>

      <div className="timeline-track relative" ref={trackRef}>
        {/* Animated vertical path */}
        <div className="timeline-line" aria-hidden="true">
          <span style={{ height: `${progress * 100}%` }} />
        </div>

        {/* Milestone Cards */}
        <div className="timeline-list">
          {items.map((item, index) => {
            const isEven = index % 2 === 0
            return (
              <motion.article
                key={item.id}
                className={`timeline-card ${
                  isEven ? 'timeline-card-pink' : 'timeline-card-blue'
                }`}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.22 }}
                transition={{
                  type: 'spring',
                  stiffness: 150,
                  damping: 20,
                }}
              >
                <p className="timeline-date">{item.displayDate}</p>
                <h2 className="text-xl font-bold text-ink">{item.title}</h2>
                <p className="timeline-text mt-1">{item.body}</p>
                {item.image && (
                  <img
                    src={item.image}
                    alt={`Kỷ niệm ${item.title}`}
                    className="w-full mt-3 rounded-2xl object-cover"
                    loading="lazy"
                  />
                )}
              </motion.article>
            )
          })}
        </div>
      </div>

      {/* Continue Button at end of timeline */}
      <div className="mt-10 mb-6 flex justify-center">
        <button
          type="button"
          onClick={onComplete}
          className="romantic-button romantic-button-primary"
        >
          {content.timeline.continueButton}
        </button>
      </div>
    </section>
  )
}
