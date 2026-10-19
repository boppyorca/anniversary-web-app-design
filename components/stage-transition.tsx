'use client'

import React, { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import type { Variants } from 'framer-motion'

interface StageTransitionProps {
  stageKey: string
  children: React.ReactNode
  onAnimationComplete?: () => void
}

export function StageTransition({
  stageKey,
  children,
  onAnimationComplete,
}: StageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    // Move focus to the new stage's h1
    const timer = setTimeout(() => {
      const heading = containerRef.current?.querySelector('h1')
      if (heading) {
        if (!heading.hasAttribute('tabindex')) {
          heading.setAttribute('tabindex', '-1')
        }
        heading.focus({ preventScroll: true })
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [stageKey])

  const variants: Variants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, transition: { duration: 0.2 } },
      }
    : {
        initial: { opacity: 0, y: 24, scale: 1 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 170,
            damping: 22,
          },
        },
        exit: {
          opacity: 0,
          scale: 0.97,
          transition: {
            duration: 0.28,
            ease: 'easeIn',
          },
        },
      }

  return (
    <motion.div
      ref={containerRef}
      key={stageKey}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      className="w-full flex-1 flex flex-col items-center exit:pointer-events-none"
    >
      {children}
    </motion.div>
  )
}

export function GradientWipe({ active }: { active: boolean }) {
  const shouldReduceMotion = useReducedMotion()
  if (shouldReduceMotion || !active) return null

  return (
    <motion.div
      key="wipe"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.85, 0] }}
      transition={{ duration: 0.52, times: [0, 0.45, 1], ease: 'easeInOut' }}
      className="fixed inset-0 pointer-events-none z-50"
      style={{
        background: 'linear-gradient(135deg, var(--pink-300), var(--blue-300))',
      }}
      aria-hidden="true"
    />
  )
}
