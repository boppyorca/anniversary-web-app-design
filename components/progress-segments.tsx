'use client'

import { STAGES } from '@/lib/progress'

interface ProgressSegmentsProps {
  currentIndex: number
  unlockedIndex: number
  onSelectStage?: (index: number) => void
  className?: string
}

export function ProgressSegments({
  currentIndex,
  unlockedIndex,
  onSelectStage,
  className = '',
}: ProgressSegmentsProps) {
  return (
    <nav
      className={`progress-nav w-full max-w-[320px] mx-auto ${className}`}
      aria-label="Tiến trình kỷ niệm"
    >
      <div className="flex items-center justify-between gap-1.5 w-full">
        {STAGES.map((stage, index) => {
          const isUnlocked = index <= unlockedIndex
          const isActive = index <= currentIndex
          const isCurrent = index === currentIndex

          return (
            <button
              key={stage.id}
              type="button"
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectStage?.(index)}
              className="group relative flex-1 min-h-[44px] flex items-center justify-center p-0 bg-transparent border-0 outline-none cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-pink-500"
              aria-label={`Bước ${index + 1}: ${stage.label}${!isUnlocked ? ' (chưa mở khóa)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={`block h-1 w-full rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-pink-500 shadow-sm'
                    : isUnlocked
                      ? 'bg-pink-300/60 group-hover:bg-pink-300'
                      : 'bg-cream/45 opacity-50'
                }`}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
