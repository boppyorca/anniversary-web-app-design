'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Volume2, VolumeX, X } from 'lucide-react'
import { Be_Vietnam_Pro, Pacifico, Playpen_Sans } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['vietnamese', 'latin'], weight: '400', variable: '--font-pacifico' })
const playpen = Playpen_Sans({ subsets: ['vietnamese', 'latin'], variable: '--font-playpen' })
const vietnam = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: '400', variable: '--font-vietnam' })

function Button({ children, variant = 'primary', onClick }: { children: React.ReactNode; variant?: 'primary' | 'quiet'; onClick?: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      className={`romantic-button romantic-button-${variant}`}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`romantic-card ${className}`}>{children}</section>
}

function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="romantic-field">
      <span>{label}</span>
      <input placeholder={placeholder} />
    </label>
  )
}

function ProgressSegments({ active = 2, total = 5 }: { active?: number; total?: number }) {
  return <div className="progress-segments" aria-label={`Đang ở bước ${active} trên ${total}`} role="progressbar" aria-valuenow={active} aria-valuemin={1} aria-valuemax={total}>{Array.from({ length: total }).map((_, index) => <span key={index} className={index < active ? 'is-active' : ''} />)}</div>
}

function BottomSheet({ onClose }: { onClose: () => void }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" initial={reduceMotion ? false : { y: '100%' }} animate={{ y: 0 }} exit={reduceMotion ? undefined : { y: '100%' }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <button className="icon-button sheet-close" aria-label="Đóng" onClick={onClose}><X /></button>
        <p className="eyebrow">MỘT LỜI NHẮN NHỎ</p>
        <h2 id="sheet-title">Mình cùng viết tiếp nhé?</h2>
        <p className="sheet-copy">Có những ngày rất bình thường, nhưng khi có cậu, mọi thứ đều dịu dàng hơn.</p>
        <Button onClick={onClose}>Bắt đầu thôi <ArrowRight /></Button>
      </motion.div>
    </motion.div>
  )
}

export default function Page() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  return (
    <main className={`${pacifico.variable} ${playpen.variable} ${vietnam.variable} app-shell`}>
      <div className="blob blob-pink" /><div className="blob blob-blue" />
      <div className="grain" />
      <div className="phone-frame">
        <header className="topbar">
          <span className="brand-mark">thương</span>
          <button className="icon-button" aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'} onClick={() => setSoundOn(!soundOn)}>{soundOn ? <Volume2 /> : <VolumeX />}</button>
        </header>
        <div className="content-stack">
          <ProgressSegments />
          <div className="hero-copy"><p className="eyebrow">NGÀY CỦA CHÚNG MÌNH</p><h1>Gửi cậu,<br /><span>người mình thương.</span></h1><p className="lead">Một góc nhỏ để cất giữ những điều thật đẹp của hai đứa.</p></div>
          <Card className="memory-card"><div className="card-kicker">KỶ NIỆM #01</div><p className="memory-quote">“Cảm ơn cậu vì đã luôn ở đây, trong những ngày nắng và cả những ngày mưa.”</p><p className="memory-date">14 tháng 02, 2024</p></Card>
          <div className="component-preview"><p className="eyebrow">BỘ THIẾT KẾ</p><Input label="Tên gọi thân mật" placeholder="Ví dụ: bé con" /><Button onClick={() => setSheetOpen(true)}>Mở lá thư <ArrowRight /></Button><Button variant="quiet">Nút nhẹ nhàng</Button></div>
          <div className="token-note"><span className="swatch swatch-pink" /><span className="swatch swatch-blue" /><span className="swatch swatch-cream" /><p>Mềm mại · Trong veo · Có đôi</p></div>
        </div>
      </div>
      {sheetOpen && <BottomSheet onClose={() => setSheetOpen(false)} />}
    </main>
  )
}

export { Button, Card, Input, ProgressSegments, BottomSheet }

export const designTokens = {
  colors: { pink50: '#FFF6F9', pink100: '#FFE3EC', pink300: '#FFB8CC', pink500: '#F27FA5', blue50: '#F3F8FF', blue100: '#DDEBFF', blue300: '#AFCFF7', blue500: '#6EA6E6', cream: '#FFFBF8', ink: '#3A2F4B', inkSoft: '#6B5F80' },
  radius: '28px', buttonHeight: '56px', background: '160deg #FFE3EC → #DDEBFF',
}
