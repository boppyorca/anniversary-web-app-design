'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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

function FlipCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="counter-unit">
      <div className="flip-cell" aria-label={`${value} ${label}`}><span>{value}</span></div>
      <span className="counter-label">{label}</span>
    </div>
  )
}

export default function Page() {
  const [days, setDays] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) {
      setDays(360)
      return
    }
    let frame = 0
    const started = performance.now()
    const count = (now: number) => {
      const progress = Math.min((now - started) / 1800, 1)
      setDays(Math.round(360 * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(count)
    }
    frame = requestAnimationFrame(count)
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion])

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const hours = String(Math.floor(elapsed / 3600) % 24).padStart(2, '0')
  const minutes = String(Math.floor(elapsed / 60) % 60).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')
  const complete = days === 360

  return (
    <main className={`${pacifico.variable} ${playpen.variable} ${vietnam.variable} counter-shell`}>
      <div className="drift-circle drift-circle-pink" aria-hidden="true" />
      <div className="drift-circle drift-circle-blue" aria-hidden="true" />
      <div className="drift-circle drift-circle-cream" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <section className="counter-content" aria-labelledby="counter-title">
        <ProgressSegments active={2} total={5} />
        <div className="counter-heading">
          <p className="eyebrow">CHÚNG MÌNH ĐÃ CÙNG NHAU</p>
          <h1 id="counter-title"><span>{days}</span> ngày</h1>
          <p>và vẫn đang tiếp tục viết thêm những ngày thật đẹp.</p>
        </div>
        <div className="counter-clock" aria-label={`${hours} giờ, ${minutes} phút, ${seconds} giây`}>
          <FlipCell value={hours} label="giờ" />
          <FlipCell value={minutes} label="phút" />
          <FlipCell value={seconds} label="giây" />
        </div>
        <motion.div className="counter-action" initial={false} animate={{ opacity: complete ? 1 : 0, y: complete ? 0 : 12 }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
          <Button onClick={() => undefined}>Tiếp tục</Button>
        </motion.div>
      </section>
    </main>
  )
}

export const designTokens = {
  colors: { pink50: '#FFF6F9', pink100: '#FFE3EC', pink300: '#FFB8CC', pink500: '#F27FA5', blue50: '#F3F8FF', blue100: '#DDEBFF', blue300: '#AFCFF7', blue500: '#6EA6E6', cream: '#FFFBF8', ink: '#3A2F4B', inkSoft: '#6B5F80' },
  radius: '28px', buttonHeight: '56px', background: '160deg #FFE3EC → #DDEBFF',
}
