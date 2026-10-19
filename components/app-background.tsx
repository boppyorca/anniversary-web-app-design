'use client'

import { useEffect, useState } from 'react'
import { STAGE_IDS, type StageId } from '@/lib/progress'
import { getPerfTier, type PerfTier } from '@/lib/perf'

const STAGE_GRADIENTS: Record<StageId, string> = {
  gate: 'linear-gradient(160deg, #FFE3EC, #FFFBF8)',
  counter: 'linear-gradient(160deg, #FFE3EC, #DDEBFF)',
  video: 'linear-gradient(160deg, #DDEBFF, #DDEBFF)',
  quiz: 'linear-gradient(160deg, #FFF6F9, #DDEBFF)',
  timeline: 'linear-gradient(160deg, #FFF6F9, #F3F8FF)',
  flipbook: 'linear-gradient(160deg, #DDEBFF, #FFE3EC)',
  finale: 'linear-gradient(160deg, #FFE3EC 0%, #DDEBFF 50%, #FFB8CC 100%)',
}

interface AppBackgroundProps {
  currentStage: StageId
}

export function AppBackground({ currentStage }: AppBackgroundProps) {
  const [tier, setTier] = useState<PerfTier>('high')
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    setTier(getPerfTier())

    const handleVisibility = () => {
      setIsPaused(document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const isLowTier = tier === 'low'
  const orbFilter = isLowTier ? 'blur(24px)' : 'blur(58px)'
  const animState = isPaused || isLowTier ? 'paused' : 'running'

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Crossfading stacked stage gradient layers */}
      {STAGE_IDS.map((stageId) => (
        <div
          key={stageId}
          className="absolute inset-0 transition-opacity duration-600 ease-in-out"
          style={{
            background: STAGE_GRADIENTS[stageId],
            opacity: currentStage === stageId ? 1 : 0,
            transitionDuration: '600ms',
          }}
        />
      ))}

      {/* Persistent floating orbs */}
      <div
        className="blob blob-pink"
        style={{
          filter: orbFilter,
          animationPlayState: animState,
        }}
      />
      <div
        className="blob blob-blue"
        style={{
          filter: orbFilter,
          animationPlayState: animState,
        }}
      />
      {!isLowTier && (
        <div
          className="blob blob-pink-secondary"
          style={{
            filter: orbFilter,
            animationPlayState: animState,
          }}
        />
      )}

      {/* Single persistent grain texture */}
      <div className="grain" />
    </div>
  )
}
