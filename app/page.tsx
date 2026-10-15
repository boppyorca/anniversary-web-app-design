'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Be_Vietnam_Pro, Pacifico, Playpen_Sans } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['vietnamese', 'latin'], weight: '400', variable: '--font-pacifico' })
const playpen = Playpen_Sans({ subsets: ['vietnamese', 'latin'], variable: '--font-playpen' })
const vietnam = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: '400', variable: '--font-vietnam' })

export function Button({ children, onClick, type = 'button' }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit' }) {
  return (
    <motion.button
      type={type}
      className="romantic-button romantic-button-primary"
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`romantic-card ${className}`}>{children}</section>
}

export function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="romantic-field">
      <span>{label}</span>
      <input placeholder={placeholder} />
    </label>
  )
}

export function ProgressSegments({ active = 1, total = 5 }: { active?: number; total?: number }) {
  return <div className="progress-segments" aria-label={`Đang ở bước ${active} trên ${total}`} role="progressbar" aria-valuenow={active} aria-valuemin={1} aria-valuemax={total}>{Array.from({ length: total }).map((_, index) => <span key={index} className={index < active ? 'is-active' : ''} />)}</div>
}

export function BottomSheet({ onClose }: { onClose: () => void }) {
  return <div role="dialog" aria-modal="true" className="bottom-sheet"><button onClick={onClose}>Đóng</button></div>
}

type VideoScreenProps = { videoSrc?: string }

export function VideoScreen({ videoSrc }: VideoScreenProps) {
  const [canSkip, setCanSkip] = useState(false)
  const [ended, setEnded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (!videoSrc) return
    const timer = window.setTimeout(() => setCanSkip(true), 5000)
    return () => window.clearTimeout(timer)
  }, [videoSrc])

  return (
    <main className={`${pacifico.variable} ${playpen.variable} ${vietnam.variable} video-shell`}>
      <div className="video-orb video-orb-pink" aria-hidden="true" />
      <div className="video-orb video-orb-blue" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <section className="video-content" aria-labelledby="video-title">
        <ProgressSegments active={3} total={5} />
        <p className="eyebrow">MỘT THƯỚC PHIM NHỎ</p>
        <h1 id="video-title">Những ngày mình bên nhau</h1>
        <motion.div className="polaroid" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 22 }}>
          <div className={`video-frame ${!videoSrc ? 'video-placeholder' : ''}`}>
            {videoSrc ? <video ref={videoRef} src={videoSrc} controls={false} onPlay={() => setPlaying(true)} onEnded={() => { setPlaying(false); setEnded(true) }} aria-label="Video kỷ niệm" /> : <span>Đang chuẩn bị</span>}
            {videoSrc && !playing && !ended && <button className="play-button" type="button" aria-label="Phát video" onClick={() => { void videoRef.current?.play() }}>Phát</button>}
          </div>
          <p className="polaroid-caption">Một chút dịu dàng dành cho chúng mình</p>
        </motion.div>
        <div className="video-actions">
          {canSkip && !ended && <button className="skip-button" type="button" onClick={() => setEnded(true)}>Bỏ qua</button>}
          {ended && <Button>Tiếp tục</Button>}
        </div>
      </section>
    </main>
  )
}

export default function Page() {
  return <VideoScreen />
}

export const designTokens = {
  colors: { pink50: '#FFF6F9', pink100: '#FFE3EC', pink300: '#FFB8CC', pink500: '#F27FA5', blue50: '#F3F8FF', blue100: '#DDEBFF', blue300: '#AFCFF7', blue500: '#6EA6E6', cream: '#FFFBF8', ink: '#3A2F4B', inkSoft: '#6B5F80' },
  radius: '28px', buttonHeight: '56px', background: '160deg #FFE3EC → #DDEBFF',
}
