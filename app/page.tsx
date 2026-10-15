'use client'

import { useState } from 'react'
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

export default function Page() {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<'idle' | 'wrong' | 'success'>('idle')
  const reduceMotion = useReducedMotion()

  function unlock() {
    if (date.trim() === '14/02/2024') setStatus('success')
    else setStatus('wrong')
  }

  return (
    <main className={`${pacifico.variable} ${playpen.variable} ${vietnam.variable} gate-shell ${status === 'success' ? 'gate-success' : ''}`}>
      <div className="blob blob-pink" aria-hidden="true" />
      <div className="blob blob-blue" aria-hidden="true" />
      <div className="blob blob-pink-secondary" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <section className="gate-content" aria-labelledby="gate-title">
        <ProgressSegments active={1} total={5} />
        <div className="gate-heading">
          <p className="eyebrow">MỘT NGÀY RẤT ĐẶC BIỆT</p>
          <h1 id="gate-title">Ngày mình bắt đầu là ngày nào?</h1>
          <p className="gate-hint">Nhập ngày đầu tiên của chúng mình để mở khóa kỷ niệm.</p>
        </div>
        <form className={`gate-form ${status === 'wrong' ? 'is-wrong' : ''} ${status === 'success' ? 'is-success' : ''}`} onSubmit={(event) => { event.preventDefault(); unlock() }}>
          <label className="date-field">
            <span className="sr-only">Ngày bắt đầu, định dạng ngày tháng năm</span>
            <input
              aria-describedby={status === 'wrong' ? 'date-error' : undefined}
              aria-invalid={status === 'wrong'}
              autoComplete="off"
              inputMode="numeric"
              maxLength={10}
              placeholder="dd/mm/yyyy"
              value={date}
              onChange={(event) => { setDate(event.target.value); if (status === 'wrong') setStatus('idle') }}
            />
          </label>
          {status === 'wrong' && <p id="date-error" className="date-error" role="alert">Chưa đúng rồi, thử lại nhé</p>}
          {status !== 'success' && <Button type="submit">Mở khóa</Button>}
        </form>
        {status === 'success' && <motion.p className="success-message" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 22 }}>Đúng rồi. Mình cùng bước tiếp nhé.</motion.p>}
      </section>
    </main>
  )
}

export const designTokens = {
  colors: { pink50: '#FFF6F9', pink100: '#FFE3EC', pink300: '#FFB8CC', pink500: '#F27FA5', blue50: '#F3F8FF', blue100: '#DDEBFF', blue300: '#AFCFF7', blue500: '#6EA6E6', cream: '#FFFBF8', ink: '#3A2F4B', inkSoft: '#6B5F80' },
  radius: '28px', buttonHeight: '56px', background: '160deg #FFE3EC → #DDEBFF',
}
