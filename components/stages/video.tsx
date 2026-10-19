'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { content } from '@/content/content'
import { trackEvent } from '@/lib/api'

interface VideoStageProps {
  onComplete: () => void
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SoundIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
      </svg>
    )
  }
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function ThinArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function VideoStage({ onComplete }: VideoStageProps) {
  // Allow NEXT_PUBLIC_VIDEO_URL to override content.video.src
  const videoSrc = process.env.NEXT_PUBLIC_VIDEO_URL || content.video.src
  const skipAfterSec = content.video.skipAfterSec || 5

  const [hasError, setHasError] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const [ended, setEnded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showNullContinue, setShowNullContinue] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<number>(720 / 1280) // default 9:16 vertical
  const [controlsVisible, setControlsVisible] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const hideControlsTimer = useRef<number | null>(null)
  const reduceMotion = useReducedMotion()

  const isPlaceholder = !videoSrc || hasError

  // Fallback timer when video is missing or 404s
  useEffect(() => {
    if (isPlaceholder) {
      const timer = window.setTimeout(() => {
        setShowNullContinue(true)
      }, 1500)
      return () => window.clearTimeout(timer)
    }

    const skipTimer = window.setTimeout(() => {
      setCanSkip(true)
    }, skipAfterSec * 1000)

    return () => window.clearTimeout(skipTimer)
  }, [isPlaceholder, skipAfterSec])

  // Controls auto-hide while playing
  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimer.current) {
      window.clearTimeout(hideControlsTimer.current)
    }
    if (playing) {
      hideControlsTimer.current = window.setTimeout(() => {
        setControlsVisible(false)
      }, 2500)
    }
  }, [playing])

  useEffect(() => {
    resetControlsTimeout()
    return () => {
      if (hideControlsTimer.current) {
        window.clearTimeout(hideControlsTimer.current)
      }
    }
  }, [playing, resetControlsTimeout])

  function togglePlay() {
    if (!videoRef.current || isPlaceholder) return
    if (playing) {
      videoRef.current.pause()
      setPlaying(false)
      setControlsVisible(true)
    } else {
      void videoRef.current.play()
      setPlaying(true)
      trackEvent('video_play', 'video', { time: Math.round(currentTime) })
    }
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation()
    if (!videoRef.current) return
    const nextMuted = !muted
    videoRef.current.muted = nextMuted
    setMuted(nextMuted)
    resetControlsTimeout()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      togglePlay()
    }
  }

  function handleSkip() {
    setEnded(true)
    if (videoRef.current) {
      videoRef.current.pause()
    }
    trackEvent('video_skip', 'video', { time: Math.round(currentTime) })
    onComplete()
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
    const bar = progressBarRef.current
    const video = videoRef.current
    if (!bar || !video || !duration) return

    const rect = bar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    const seekTo = percentage * duration
    video.currentTime = seekTo
    setCurrentTime(seekTo)
    resetControlsTimeout()
  }

  function handleLoadedMetadata() {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration || 0)
    const w = video.videoWidth
    const h = video.videoHeight
    if (w && h) {
      setAspectRatio(w / h)
    }
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <section
      className="video-content w-full max-w-[430px] mx-auto min-h-[calc(100svh-90px)] flex flex-col items-center justify-center px-2.5 sm:px-4 py-3 text-center"
      aria-labelledby="video-title"
    >
      <header className="flex flex-col items-center gap-0.5 mb-2">
        <p className="eyebrow">{content.video.title}</p>
        <h1 id="video-title" className="sr-only">
          {content.video.title}
        </h1>
      </header>

      {/* Expanded Polaroid Frame - Crisp and clear, no blur */}
      <motion.div
        className="polaroid w-full max-w-[400px] mx-auto shadow-2xl p-2 sm:p-2.5 pb-4 rounded-2xl bg-cream border border-pink-200/60"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
      >
        <div
          tabIndex={!isPlaceholder ? 0 : -1}
          role={!isPlaceholder ? 'button' : undefined}
          aria-label={
            !isPlaceholder
              ? playing
                ? 'Tạm dừng thước phim'
                : 'Phát thước phim kỷ niệm'
              : undefined
          }
          onKeyDown={!isPlaceholder ? handleKeyDown : undefined}
          onClick={!isPlaceholder ? togglePlay : undefined}
          onMouseMove={resetControlsTimeout}
          onTouchStart={resetControlsTimeout}
          style={{
            aspectRatio: isPlaceholder ? '16/10' : `${aspectRatio}`,
            maxHeight: '70svh',
            width: '100%',
          }}
          className={`video-frame relative w-full overflow-hidden rounded-xl bg-ink/95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-pink-500 select-none flex items-center justify-center ${
            isPlaceholder ? 'video-placeholder' : ''
          }`}
        >
          {!isPlaceholder ? (
            <>
              {/* Crisp Video Element without any blur */}
              <video
                ref={videoRef}
                src={videoSrc}
                poster={content.video.poster}
                playsInline
                preload="auto"
                controls={false}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime)
                  }
                }}
                onPlay={() => {
                  setPlaying(true)
                  resetControlsTimeout()
                }}
                onPause={() => {
                  setPlaying(false)
                  setControlsVisible(true)
                }}
                onEnded={() => {
                  setPlaying(false)
                  setEnded(true)
                  setControlsVisible(true)
                  trackEvent('video_ended', 'video')
                }}
                onError={() => {
                  setHasError(true)
                }}
                className="w-full h-full object-contain block relative z-10"
                aria-label="Thước phim kỷ niệm của chúng mình"
              />

              {/* Sound Toggle (Top-right, allowed icon) */}
              <button
                type="button"
                onClick={toggleMute}
                className="absolute top-3 right-3 z-30 min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-ink/75 text-white hover:bg-ink transition-colors flex items-center justify-center shadow-md focus-visible:ring-2 focus-visible:ring-pink-300"
                aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                <SoundIcon muted={muted} />
              </button>

              {/* Center Play Button when paused */}
              {!playing && !ended && (
                <button
                  type="button"
                  className="play-button z-30 scale-110"
                  aria-label="Phát video"
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlay()
                  }}
                >
                  Phát
                </button>
              )}

              {/* Bottom Scrubber & Time (Fades in/out) */}
              <div
                className={`absolute bottom-0 inset-x-0 z-30 p-3 pt-8 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent transition-opacity duration-300 flex flex-col gap-1.5 ${
                  controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Progress bar with touch target */}
                <div
                  ref={progressBarRef}
                  onClick={handleSeek}
                  className="w-full h-3 py-1 cursor-pointer relative flex items-center"
                  role="slider"
                  aria-label="Thanh thời gian thước phim"
                  aria-valuemin={0}
                  aria-valuemax={duration || 1}
                  aria-valuenow={currentTime}
                >
                  <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500 rounded-full transition-all duration-100"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Time Display */}
                <div className="flex items-center justify-between text-xs font-vietnam font-medium text-white/90 px-0.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center z-10">
              <span className="font-hand text-ink-soft text-lg">
                {content.video.placeholderText}
              </span>
              <span className="text-xs text-ink-soft/75 mt-1 font-vietnam">
                (Thước phim dịu dàng sắp ra mắt)
              </span>
            </div>
          )}
        </div>

        <p className="polaroid-caption mt-2.5 font-hand text-sm text-ink-soft">
          {content.video.caption}
        </p>
      </motion.div>

      {/* Action Buttons */}
      <div className="video-actions mt-3 flex items-center justify-center gap-4 min-h-[56px]">
        {/* Placeholder Flow: Continue after 1.5s */}
        {isPlaceholder && showNullContinue && (
          <motion.button
            type="button"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="romantic-button romantic-button-primary"
          >
            Tiếp tục
          </motion.button>
        )}

        {/* Video Loaded Flow: Skip button after 5s */}
        {!isPlaceholder && canSkip && !ended && (
          <button
            type="button"
            onClick={handleSkip}
            className="skip-button min-h-[44px] px-3 py-2 inline-flex items-center gap-1.5 font-hand text-ink-soft hover:text-ink transition-colors"
          >
            <span>Bỏ qua</span>
            <ThinArrowIcon />
          </button>
        )}

        {/* Video Ended Flow: Continue button */}
        {!isPlaceholder && ended && (
          <motion.button
            type="button"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={onComplete}
            className="romantic-button romantic-button-primary"
          >
            Tiếp tục
          </motion.button>
        )}
      </div>
    </section>
  )
}
