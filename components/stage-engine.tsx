'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { STAGES, STAGE_IDS, type StageId, type ProgressState, loadProgress, saveProgress } from '@/lib/progress'
import { createSession, trackEvent } from '@/lib/api'
import { AppBackground } from './app-background'
import { ProgressSegments } from './progress-segments'
import { StageTransition, GradientWipe } from './stage-transition'

import { GateStage } from './stages/gate'
import { CounterStage } from './stages/counter'
import { VideoStage } from './stages/video'
import { QuizStage } from './stages/quiz'
import { TimelineStage } from './stages/timeline'
import { FlipbookStage } from './stages/flipbook'
import { FinaleStage } from './stages/finale'

const SESSION_STAGE_KEY = 'anniv:v1:session_stage'

export function StageEngine() {
  const [progress, setProgress] = useState<ProgressState>({ index: 0, unlocked: 0 })
  const [hydrated, setHydrated] = useState(false)
  const [wipeActive, setWipeActive] = useState(false)
  const [isDev, setIsDev] = useState(false)

  // Hydrate progress safely on mount
  useEffect(() => {
    const saved = loadProgress()
    let initialIndex = 0
    let initialUnlocked = saved.unlocked
    let hasExplicitParam = false

    // 1. Check URL parameters
    try {
      const params = new URLSearchParams(window.location.search)

      // Parameter ?reset=true or ?clear=true: Wipe all saved progress
      if (params.get('reset') === 'true' || params.get('clear') === 'true') {
        localStorage.removeItem('anniv:v1:progress')
        sessionStorage.removeItem(SESSION_STAGE_KEY)
        sessionStorage.removeItem('anniv:v1:flip-pos')
        initialIndex = 0
        initialUnlocked = 0
        hasExplicitParam = true
      } else {
        // Parameter ?stage=<name or index>: Direct jump for testing
        const stageParam = params.get('stage')
        if (stageParam) {
          const namedIdx = STAGE_IDS.indexOf(stageParam as StageId)
          const numIdx = Number(stageParam)
          const targetIdx = namedIdx >= 0 ? namedIdx : (!isNaN(numIdx) ? numIdx : -1)
          if (targetIdx >= 0 && targetIdx < STAGES.length) {
            initialIndex = targetIdx
            initialUnlocked = Math.max(initialUnlocked, targetIdx)
            hasExplicitParam = true
          }
        }
      }

      // Check dev helper
      const devParam = params.get('dev')
      const expectedToken = process.env.NEXT_PUBLIC_DEV_TOKEN
      if (
        devParam === 'true' ||
        (devParam && expectedToken && devParam === expectedToken)
      ) {
        setIsDev(true)
      }
    } catch {
      // ignore
    }

    // 2. If no explicit URL parameter was given:
    // Only resume stage if this tab is in an active session (e.g. page refresh)
    // A fresh click on the link / new tab must ALWAYS start at Gate (index 0)
    if (!hasExplicitParam) {
      try {
        const sessionStage = sessionStorage.getItem(SESSION_STAGE_KEY)
        if (sessionStage !== null) {
          const parsed = Number(sessionStage)
          if (!isNaN(parsed) && parsed >= 0 && parsed < STAGES.length) {
            initialIndex = Math.min(parsed, initialUnlocked)
          }
        } else {
          // Fresh visit: start at Stage 0 (Gate)
          initialIndex = 0
        }
      } catch {
        initialIndex = 0
      }
    }

    const nextState: ProgressState = {
      index: initialIndex,
      unlocked: initialUnlocked,
    }

    setProgress(nextState)
    saveProgress(nextState)
    try {
      sessionStorage.setItem(SESSION_STAGE_KEY, String(initialIndex))
    } catch {
      // ignore
    }

    setHydrated(true)
    createSession()
    trackEvent('session_init', STAGES[initialIndex].id, { resumedStage: initialIndex })
  }, [])

  // Preload next stage's dynamic chunk during idle
  useEffect(() => {
    if (!hydrated) return
    const nextIndex = progress.index + 1
    if (nextIndex >= STAGES.length) return

    const idleCallback =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 1000)

    const handle = idleCallback(() => {
      const nextStage = STAGES[nextIndex].id
      switch (nextStage) {
        case 'counter':
          void import('./stages/counter')
          break
        case 'video':
          void import('./stages/video')
          break
        case 'quiz':
          void import('./stages/quiz')
          break
        case 'timeline':
          void import('./stages/timeline')
          break
        case 'flipbook':
          void import('./stages/flipbook')
          break
        case 'finale':
          void import('./stages/finale')
          break
      }
    })

    return () => {
      if (typeof window.cancelIdleCallback === 'function' && typeof handle === 'number') {
        window.cancelIdleCallback(handle)
      }
    }
  }, [hydrated, progress.index])

  function triggerWipe() {
    setWipeActive(true)
    setTimeout(() => {
      setWipeActive(false)
    }, 550)
  }

  function handleNext() {
    const nextIdx = Math.min(progress.index + 1, STAGES.length - 1)
    const nextUnlocked = Math.max(progress.unlocked, nextIdx)
    const nextState = { index: nextIdx, unlocked: nextUnlocked }
    setProgress(nextState)
    saveProgress(nextState)
    try {
      sessionStorage.setItem(SESSION_STAGE_KEY, String(nextIdx))
    } catch {
      // ignore
    }
    triggerWipe()
    trackEvent('stage_advance', STAGES[nextIdx].id, { toStage: nextIdx })
  }

  function handleGoTo(idx: number) {
    if (idx <= progress.unlocked && idx !== progress.index) {
      const nextState = { ...progress, index: idx }
      setProgress(nextState)
      saveProgress(nextState)
      try {
        sessionStorage.setItem(SESSION_STAGE_KEY, String(idx))
      } catch {
        // ignore
      }
      triggerWipe()
      trackEvent('stage_jump', STAGES[idx].id, { toStage: idx })
    }
  }

  function handleReset() {
    // Reset returns to index 1 (counter) without re-locking the gate, keeping answers
    const nextUnlocked = Math.max(progress.unlocked, 1)
    const nextState = { index: 1, unlocked: nextUnlocked }
    setProgress(nextState)
    saveProgress(nextState)
    try {
      sessionStorage.setItem(SESSION_STAGE_KEY, '1')
    } catch {
      // ignore
    }
    triggerWipe()
    trackEvent('stage_reset', 'counter')
  }

  function handleFullReset() {
    // Reset completely to Gate stage (index 0, unlocked 0)
    try {
      localStorage.removeItem('anniv:v1:progress')
      sessionStorage.removeItem(SESSION_STAGE_KEY)
      sessionStorage.removeItem('anniv:v1:flip-pos')
    } catch {
      // ignore
    }
    const resetState = { index: 0, unlocked: 0 }
    setProgress(resetState)
    saveProgress(resetState)
    triggerWipe()
    trackEvent('stage_reset', 'gate')
  }

  const currentStageId = STAGES[progress.index]?.id || 'gate'

  // Render only background until progress is restored to prevent flash of wrong stage
  if (!hydrated) {
    return (
      <main className="relative min-h-[100svh] w-full flex flex-col justify-between">
        <AppBackground currentStage="gate" />
      </main>
    )
  }

  return (
    <main className="relative min-h-[100svh] w-full flex flex-col justify-between overflow-x-hidden">
      {/* 1. Persistent crossfading background (outside AnimatePresence) */}
      <AppBackground currentStage={currentStageId} />

      {/* 2. Full-screen pastel gradient wipe during stage swap */}
      <GradientWipe active={wipeActive} />

      {/* 3. Top Progress Nav: 7 segments (non-clickable while at Gate to prevent bypass) */}
      <header className="w-full pt-4 pb-2 px-4 z-30">
        <ProgressSegments
          currentIndex={progress.index}
          unlockedIndex={currentStageId === 'gate' ? 0 : progress.unlocked}
          onSelectStage={currentStageId === 'gate' ? undefined : handleGoTo}
        />
      </header>

      {/* 4. Active Stage within AnimatePresence */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-20">
        <AnimatePresence mode="wait" initial={false}>
          <StageTransition key={currentStageId} stageKey={currentStageId}>
            {currentStageId === 'gate' && <GateStage onComplete={handleNext} />}
            {currentStageId === 'counter' && <CounterStage onComplete={handleNext} />}
            {currentStageId === 'video' && <VideoStage onComplete={handleNext} />}
            {currentStageId === 'quiz' && <QuizStage onComplete={handleNext} />}
            {currentStageId === 'timeline' && <TimelineStage onComplete={handleNext} />}
            {currentStageId === 'flipbook' && <FlipbookStage onComplete={handleNext} />}
            {currentStageId === 'finale' && (
              <FinaleStage
                onComplete={handleNext}
                onGoToStage={handleGoTo}
                onResetJourney={handleReset}
              />
            )}
          </StageTransition>
        </AnimatePresence>
      </div>

      {/* Dev helper: shown when ?dev=true or in development */}
      {isDev && (
        <aside
          className="fixed bottom-3 right-3 z-50 bg-cream/95 border border-pink-300 rounded-xl p-2.5 shadow-lg flex items-center gap-2 text-xs"
          aria-label="Development helper"
        >
          <label htmlFor="dev-stage-select" className="font-semibold text-ink">
            Dev:
          </label>
          <select
            id="dev-stage-select"
            value={progress.index}
            onChange={(e) => {
              const idx = Number(e.target.value)
              const nextUnlocked = Math.max(progress.unlocked, idx)
              const nextState = { index: idx, unlocked: nextUnlocked }
              setProgress(nextState)
              saveProgress(nextState)
              try {
                sessionStorage.setItem(SESSION_STAGE_KEY, String(idx))
              } catch {
                // ignore
              }
              triggerWipe()
            }}
            className="rounded border border-pink-300 bg-white p-1 text-xs text-ink"
          >
            {STAGES.map((s, i) => (
              <option key={s.id} value={i}>
                {i + 1}. {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleFullReset}
            className="rounded bg-pink-100 px-2 py-1 text-pink-500 font-bold hover:bg-pink-300 hover:text-ink"
            title="Reset về Cổng mở khóa (Gate)"
          >
            Reset
          </button>
        </aside>
      )}
    </main>
  )
}
