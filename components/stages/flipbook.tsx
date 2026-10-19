'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { content } from '@/content/content'
import { trackEvent } from '@/lib/api'
import { buildSheets, type Sheet } from '@/lib/flipbook'

interface FlipbookStageProps {
  onComplete: () => void
}

export function FlipbookStage({ onComplete }: FlipbookStageProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [turning, setTurning] = useState(false)
  const [turnDirection, setTurnDirection] = useState<'forward' | 'backward'>('forward')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [showBonusModal, setShowBonusModal] = useState(false)

  // Build sheets strictly via lib/flipbook
  const sheets: Sheet[] = useMemo(() => buildSheets(content.flipbook), [])
  const totalSheets = sheets.length // exactly 18

  // Remember position in sessionStorage "anniv:v1:flip-pos"
  const [sheetIndex, setSheetIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('anniv:v1:flip-pos')
        if (saved !== null) {
          const parsed = parseInt(saved, 10)
          if (!isNaN(parsed) && parsed >= 0 && parsed < 18) {
            return parsed
          }
        }
      } catch {
        // Ignore access errors
      }
    }
    return 0
  })

  const holdTimerRef = useRef<number | null>(null)
  const holdStartRef = useRef(0)
  const touchStartRef = useRef<number | null>(null)
  const turningLockRef = useRef(false)
  const completedRef = useRef(false)
  const reduceMotion = useReducedMotion()

  // Sync sheetIndex with sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('anniv:v1:flip-pos', String(sheetIndex))
      } catch {
        // Ignore access errors
      }
    }
  }, [sheetIndex])

  // Envelope hold-to-open logic
  const stopHolding = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearInterval(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (!unlocked) {
      setHoldProgress(0)
    }
  }, [unlocked])

  const startHolding = useCallback(() => {
    if (unlocked) return
    holdStartRef.current = Date.now()
    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current
      const progress = Math.min(1, elapsed / 1500)
      setHoldProgress(progress)
      if (progress >= 1) {
        stopHolding()
        setUnlocked(true)
        trackEvent('flipbook_opened', 'flipbook')
      }
    }, 25)
  }, [unlocked, stopHolding])

  // Turn page logic with turning lock to prevent double-turns
  const turn = useCallback(
    (direction: 1 | -1) => {
      if (!unlocked || turningLockRef.current) return
      const target = sheetIndex + direction
      if (target < 0 || target >= totalSheets) return

      turningLockRef.current = true
      setTurnDirection(direction === 1 ? 'forward' : 'backward')
      setTurning(true)
      setSheetIndex(target)

      const lockDuration = reduceMotion ? 200 : 650
      window.setTimeout(() => {
        turningLockRef.current = false
        setTurning(false)
      }, lockDuration)
    },
    [unlocked, sheetIndex, totalSheets, reduceMotion]
  )

  // Keyboard navigation: ArrowLeft / ArrowRight
  useEffect(() => {
    if (!unlocked) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        turn(1)
      } else if (e.key === 'ArrowLeft') {
        turn(-1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [unlocked, turn])

  // Preload next sheet image on idle
  useEffect(() => {
    if (!unlocked) return
    const nextSheet = sheets[sheetIndex + 1]
    if (nextSheet && nextSheet.kind === 'page') {
      const src = nextSheet.page.src
      if (typeof window !== 'undefined') {
        const preload = () => {
          const img = new Image()
          img.src = src
        }
        const win = window as unknown as Window & {
          requestIdleCallback?: (cb: () => void) => number
          cancelIdleCallback?: (id: number) => void
        }
        if (typeof win.requestIdleCallback === 'function') {
          const handle = win.requestIdleCallback(preload)
          return () => win.cancelIdleCallback?.(handle)
        } else {
          const timer = setTimeout(preload, 250)
          return () => clearTimeout(timer)
        }
      }
    }
  }, [unlocked, sheetIndex, sheets])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        window.clearInterval(holdTimerRef.current)
      }
    }
  }, [])

  // Single-fire onComplete
  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  const handleImageError = useCallback((src: string) => {
    setImageErrors((prev) => ({ ...prev, [src]: true }))
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Flipbook] Lỗi tải ảnh: ${src}`)
    }
  }, [])

  const handleRetryImage = useCallback((src: string) => {
    setImageErrors((prev) => {
      const next = { ...prev }
      delete next[src]
      return next
    })
  }, [])

  const currentSheet = sheets[sheetIndex]

  // Dynamic card aspect ratio and sizing so images of all aspect ratios (1:1, 9:16, 4:5) fill the frame cleanly
  const cardStyle = useMemo(() => {
    if (currentSheet.kind === 'page') {
      const { width, height } = currentSheet.page
      const ratio = width / height

      if (Math.abs(ratio - 1) < 0.15) {
        // Square (1:1) -> Pages 1-3
        return {
          aspectRatio: '1 / 1',
          maxWidth: '350px',
          maxHeight: '62vh',
        }
      }
      if (ratio < 0.68) {
        // Tall / 9:16 -> Pages 4-6
        return {
          aspectRatio: '9 / 16',
          maxWidth: '330px',
          maxHeight: '68vh',
        }
      }
      // 4:5 or standard photo ratio -> Pages 7-15
      return {
        aspectRatio: `${width} / ${height}`,
        maxWidth: '350px',
        maxHeight: '64vh',
      }
    }
    // Cover, Notes, Back -> 4:5 card format
    return {
      aspectRatio: '4 / 5',
      maxWidth: '350px',
      maxHeight: '64vh',
    }
  }, [currentSheet])

  return (
    <section
      className={`flipbook-content w-full max-w-[430px] mx-auto min-h-[calc(100svh-100px)] flex flex-col items-center justify-center px-4 py-5 text-center ${
        unlocked ? 'is-unlocked' : ''
      }`}
      aria-labelledby="flipbook-title"
    >
      {!unlocked ? (
        <>
          <p className="eyebrow">{content.flipbook.eyebrow}</p>
          <h1 id="flipbook-title">{content.flipbook.title}</h1>

          {/* Envelope with hold-to-open seal */}
          <div className="envelope my-6" aria-label="Phong bì đang khóa">
            <div className="envelope-flap" />
            <div className="wax-seal-wrap">
              <svg className="hold-ring" viewBox="0 0 100 100" aria-hidden="true">
                <circle className="hold-ring-track" cx="50" cy="50" r="44" />
                <circle
                  className="hold-ring-progress"
                  cx="50"
                  cy="50"
                  r="44"
                  pathLength="1"
                  style={{ strokeDashoffset: 1 - holdProgress }}
                />
              </svg>
              <button
                type="button"
                className={`wax-seal ${holdProgress >= 1 ? 'is-cracked' : ''}`}
                onPointerDown={startHolding}
                onPointerUp={stopHolding}
                onPointerLeave={stopHolding}
                onPointerCancel={stopHolding}
                aria-label="Nhấn và giữ con dấu để mở thư"
              >
                {holdProgress >= 1 ? content.flipbook.openedText : content.flipbook.holdText}
              </button>
            </div>
          </div>
          <p className="hold-hint">{content.flipbook.holdHint}</p>
        </>
      ) : (
        <motion.div
          className="book-stage w-full flex flex-col items-center"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="eyebrow">{content.flipbook.bookEyebrow}</p>
          <h1 id="flipbook-title" className="sr-only">
            Sách kỷ niệm của chúng mình
          </h1>

          {/* 3D Book Page Container with adaptive aspect ratio */}
          <div
            className="relative w-full my-3 flex items-center justify-center transition-all duration-300"
            style={{
              aspectRatio: cardStyle.aspectRatio,
              maxWidth: cardStyle.maxWidth,
              maxHeight: cardStyle.maxHeight,
              perspective: '1200px',
            }}
            onTouchStart={(e) => {
              touchStartRef.current = e.touches[0].clientX
            }}
            onTouchEnd={(e) => {
              if (touchStartRef.current === null) return
              const diff = e.changedTouches[0].clientX - touchStartRef.current
              touchStartRef.current = null
              if (Math.abs(diff) > 35) {
                turn(diff < 0 ? 1 : -1)
              }
            }}
          >
            <motion.div
              key={sheetIndex}
              className="book-page w-full h-full relative overflow-hidden rounded-2xl shadow-xl select-none"
              style={{
                transformOrigin: turnDirection === 'forward' ? 'left center' : 'right center',
              }}
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : turnDirection === 'forward'
                    ? { rotateY: 70, opacity: 0.6 }
                    : { rotateY: -70, opacity: 0.6 }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { rotateY: 0, opacity: 1 }
              }
              transition={{
                duration: reduceMotion ? 0.2 : 0.6,
                ease: [0.25, 1, 0.5, 1],
              }}
            >
              {/* Sheet 1: Cover (UI composed) */}
              {currentSheet.kind === 'cover' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-100 via-cream to-blue-100 border-2 border-pink-300/40 text-center">
                  <span className="font-display text-3xl sm:text-4xl text-ink leading-tight">
                    {content.flipbook.coverTitle}
                  </span>
                  <p className="font-hand text-pink-500 text-lg mt-4">
                    Chỉ dành riêng cho em
                  </p>
                  <p className="text-xs text-ink-soft/70 mt-8 tracking-widest uppercase">
                    Chạm bên phải để mở trang
                  </p>
                </div>
              )}

              {/* Sheets 2..16: Image Pages (with blur background + contained foreground) */}
              {currentSheet.kind === 'page' && (() => {
                const page = currentSheet.page
                const isError = imageErrors[page.src]
                const isCurrent = true
                const realSrc = isCurrent ? page.src : page.blur

                return (
                  <div className="relative w-full h-full bg-cream flex items-center justify-center overflow-hidden">
                    {/* Blurred backdrop avoiding letterbox black bars */}
                    <div
                      className="page-image-backdrop"
                      style={{
                        backgroundImage: `url(${page.blur})`,
                      }}
                    />

                    {isError ? (
                      <div className="page-empty relative z-10 flex flex-col items-center justify-center gap-3 p-4">
                        <span className="font-hand text-xl text-ink">
                          Không tải được trang {page.index}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRetryImage(page.src)}
                          className="text-xs font-semibold text-pink-500 underline underline-offset-4 py-1.5 px-3 bg-cream/90 rounded-full shadow-sm hover:text-pink-600 cursor-pointer"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      <img
                        src={realSrc}
                        alt={`Trang ${page.index}/${content.flipbook.pages.length}`}
                        width={page.width}
                        height={page.height}
                        loading="eager"
                        decoding="async"
                        onError={() => handleImageError(page.src)}
                        className="relative z-10 w-full h-full object-contain"
                      />
                    )}
                  </div>
                )
              })()}

              {/* Sheet 17: Notes Sheet (UI composed) */}
              {currentSheet.kind === 'notes' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-cream border-2 border-dashed border-pink-300/60 text-center">
                  <span className="font-display text-2xl text-pink-500 mb-4">
                    Góc ghi nhớ
                  </span>
                  <p className="font-hand text-ink text-base whitespace-pre-wrap leading-relaxed max-w-[260px]">
                    {content.flipbook.notesText || 'Để chúng mình cùng viết tiếp những câu chuyện phía trước...'}
                  </p>
                </div>
              )}

              {/* Sheet 18: Back Cover Sheet (UI composed) */}
              {currentSheet.kind === 'back' && (
                <div className="w-full h-full flex flex-col items-center justify-between p-4 bg-gradient-to-br from-blue-100 via-pink-100 to-pink-300 text-center">
                  <div className="pt-1">
                    <span className="font-display text-2xl sm:text-3xl text-ink">
                      {content.flipbook.backTitle}
                    </span>
                    <p className="font-hand text-pink-500 text-sm mt-0.5">
                      Thương em thật nhiều
                    </p>
                  </div>

                  {/* Special Bonus Gift Preview Card */}
                  {content.flipbook.bonusSpread && (
                    <div className="w-full max-w-[270px] my-auto bg-white/85 backdrop-blur-xs rounded-2xl p-2.5 shadow-md border border-pink-200/80 flex flex-col items-center text-center">
                      <div
                        className="w-full aspect-[16/9] rounded-xl overflow-hidden shadow-inner mb-1.5 border border-pink-100 relative group cursor-pointer"
                        onClick={() => setShowBonusModal(true)}
                        role="button"
                        tabIndex={0}
                        aria-label="Phóng to vé xem phim kỷ niệm"
                      >
                        <img
                          src={content.flipbook.bonusSpread.image}
                          alt="Digital Scrapbook Anniversary Bonus Spread"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-ink/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[11px] font-semibold px-2 py-0.5 bg-ink/70 rounded-full">
                            Phóng to
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] tracking-wider uppercase font-semibold text-pink-500 font-vietnam">
                        {content.flipbook.bonusSpread.badge}
                      </span>
                      <p className="font-vietnam text-xs font-bold text-ink mt-0.5 leading-tight">
                        {content.flipbook.bonusSpread.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowBonusModal(true)}
                        className="mt-1.5 text-xs font-semibold text-pink-500 hover:text-pink-600 bg-pink-50 hover:bg-pink-100 py-1 px-3 rounded-full border border-pink-200 transition-colors cursor-pointer"
                      >
                        {content.flipbook.bonusSpread.openButtonText}
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-ink-soft/70 pb-0.5">
                    Nhấn nút bên dưới để tiếp tục hành trình
                  </p>
                </div>
              )}

              {/* Tap Left / Right Hotspots */}
              <button
                type="button"
                className="page-edge page-edge-left"
                aria-label="Trang trước"
                disabled={sheetIndex === 0}
                onClick={(e) => {
                  e.stopPropagation()
                  turn(-1)
                }}
              />
              <button
                type="button"
                className="page-edge page-edge-right"
                aria-label="Trang sau"
                disabled={sheetIndex === totalSheets - 1}
                onClick={(e) => {
                  e.stopPropagation()
                  turn(1)
                }}
              />
            </motion.div>
          </div>

          {/* Navigation Controls & Counter: n / 18 */}
          <div className="flex items-center justify-between w-full max-w-[320px] px-2 mt-2 text-ink-soft">
            <button
              type="button"
              disabled={sheetIndex === 0}
              onClick={() => turn(-1)}
              className="text-xs font-medium py-1 px-2 rounded hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Trước
            </button>
            <p className="page-counter font-vietnam text-xs font-semibold">
              {sheetIndex + 1} / {totalSheets}
            </p>
            <button
              type="button"
              disabled={sheetIndex === totalSheets - 1}
              onClick={() => turn(1)}
              className="text-xs font-medium py-1 px-2 rounded hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Sau →
            </button>
          </div>

          {/* Finish Button: Calls onComplete exactly once */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleComplete}
              className="text-action text-sm font-hand text-ink-soft hover:text-pink-500 transition-colors py-2 px-4 cursor-pointer"
            >
              {content.flipbook.finishButton}
            </button>
          </div>
        </motion.div>
      )}

      {/* Digital Scrapbook Bonus Spread Modal */}
      <AnimatePresence>
        {showBonusModal && content.flipbook.bonusSpread && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bonus-modal-title"
          >
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-[480px] bg-cream rounded-3xl p-5 shadow-2xl border border-white/80 flex flex-col items-center max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="w-full flex items-center justify-between pb-2.5 border-b border-pink-200/60 mb-2.5">
                <div>
                  <h2 id="bonus-modal-title" className="font-display text-xl text-ink text-left">
                    {content.flipbook.bonusSpread.title}
                  </h2>
                  <p className="text-xs text-pink-500 font-hand text-left">
                    {content.flipbook.bonusSpread.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBonusModal(false)}
                  className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-soft hover:text-ink rounded-full cursor-pointer"
                  aria-label="Đóng"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Spread Image with 16:9 ratio */}
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-lg border-2 border-pink-200/50 my-1 bg-white">
                <img
                  src={content.flipbook.bonusSpread.image}
                  alt="Scrapbook Anniversary Bonus Spread với mã QR"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Caption & Instructions */}
              <p className="text-xs text-ink-soft text-center mt-2.5 px-2 leading-relaxed font-vietnam">
                {content.flipbook.bonusSpread.tagline}
              </p>

              {/* Direct Heyzine Link Action */}
              <a
                href={content.flipbook.bonusSpread.heyzineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full py-2.5 px-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-full font-vietnam text-xs font-semibold shadow-md text-center flex items-center justify-center gap-1.5 transition-all"
              >
                <span>{content.flipbook.bonusSpread.heyzineButtonText}</span>
              </a>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="mt-2 text-xs font-hand text-ink-soft hover:text-ink py-1.5 px-3 cursor-pointer"
              >
                {content.flipbook.bonusSpread.closeText}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
