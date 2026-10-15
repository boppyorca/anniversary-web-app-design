'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Be_Vietnam_Pro, Pacifico, Playpen_Sans } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['vietnamese', 'latin'], weight: '400', variable: '--font-pacifico' })
const playpen = Playpen_Sans({ subsets: ['vietnamese', 'latin'], variable: '--font-playpen' })
const vietnam = Be_Vietnam_Pro({ subsets: ['vietnamese', 'latin'], weight: '400', variable: '--font-vietnam' })

export function Button({ children, onClick, type = 'button', disabled = false }: { children: React.ReactNode; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) {
  return (
    <motion.button
      type={type}
      className="romantic-button romantic-button-primary"
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      onClick={onClick}
      disabled={disabled}
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

type QuizScreenProps = {
  questions?: [string, string, string]
  reactions?: [string, string, string]
  onComplete?: () => void
}

type TimelineItem = {
  date: string
  title: string
  text: string
  photo?: string
}

type TimelineScreenProps = { items?: TimelineItem[] }

type FlipbookPage = { image: string; alt?: string }
type FlipbookScreenProps = { pages?: FlipbookPage[]; onComplete?: () => void }

const defaultFlipbookPages: FlipbookPage[] = [
  { image: '', alt: 'Một trang kỷ niệm' },
  { image: '', alt: 'Một trang kỷ niệm khác' },
  { image: '', alt: 'Trang cuối của kỷ niệm' },
]

const defaultTimeline: TimelineItem[] = [
  { date: '14.02.2024', title: 'Ngày đầu tiên', text: 'Mình đã bắt đầu câu chuyện dịu dàng này bằng một nụ cười thật lâu.' },
  { date: '03.03.2024', title: 'Buổi hẹn đầu', text: 'Một buổi chiều rất bình thường, bỗng trở thành điều mình muốn nhớ mãi.' },
  { date: '22.06.2024', title: 'Cùng nhau lớn lên', text: 'Tụi mình học cách lắng nghe, nhường nhịn và thương nhau nhiều hơn.' },
  { date: 'Hôm nay', title: 'Vẫn là chúng mình', text: 'Cảm ơn cậu vì đã ở đây. Phần đẹp nhất vẫn đang được viết tiếp.' },
]

const defaultQuestions: [string, string, string] = [
  'Điều gì ở mình khiến cậu mỉm cười?',
  'Kỷ niệm nào cậu muốn giữ mãi?',
  'Cậu mong chúng mình sẽ cùng nhau đi đâu?',
]

const defaultReactions: [string, string, string] = ['Dịu dàng quá', 'Mình cũng nhớ', 'Nhất định nhé']

export function VideoScreen({ videoSrc }: VideoScreenProps) {
  const [canSkip, setCanSkip] = useState(false)
  const [ended, setEnded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduceMotion = useReducedMotion()

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
        <motion.div className="polaroid" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 22 }}>
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

export function QuizScreen({ questions = defaultQuestions, reactions = defaultReactions, onComplete }: QuizScreenProps) {
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState('')
  const [pieces, setPieces] = useState<string[]>([])
  const reduceMotion = useReducedMotion()
  const isComplete = step === 3

  function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!answer.trim()) return
    setPieces((current) => [...current, reactions[step]])
    setAnswer('')
    setStep((current) => current + 1)
  }

  return (
    <main className={`${pacifico.variable} ${playpen.variable} ${vietnam.variable} quiz-shell`}>
      <div className="quiz-orb quiz-orb-one" aria-hidden="true" />
      <div className="quiz-orb quiz-orb-two" aria-hidden="true" />
      <div className="quiz-orb quiz-orb-three" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <section className="quiz-content" aria-labelledby="quiz-title">
        <ProgressSegments active={isComplete ? 3 : step + 1} total={3} />
        <div className="quiz-piece-area" aria-live="polite">
          {pieces.map((piece, index) => <motion.span key={`${piece}-${index}`} className={`quiz-piece quiz-piece-${index + 1}`} initial={reduceMotion ? false : { opacity: 0, y: 42, scale: .7 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 16 }}>{piece}</motion.span>)}
          {isComplete && <motion.span className="heart-outline" initial={reduceMotion ? false : { opacity: 0, scale: .5 }} animate={{ opacity: 1, scale: 1 }} aria-label="Ba mảnh ghép đã hoàn thành">♡</motion.span>}
        </div>
        {!isComplete ? <motion.form key={step} className="quiz-card" initial={reduceMotion ? false : { opacity: 0, x: 55 }} animate={{ opacity: 1, x: 0 }} transition={{ type: 'spring', stiffness: 230, damping: 24 }} onSubmit={submitAnswer}>
          <p className="eyebrow">CÂU HỎI {step + 1} / 3</p>
          <h1 id="quiz-title">{questions[step]}</h1>
          {step === 0 && <div className="quick-picks" aria-label="Gợi ý nhanh">{['Nụ cười', 'Sự dịu dàng', 'Cách cậu lắng nghe'].map((pick) => <button type="button" key={pick} className={`quick-chip ${answer === pick ? 'is-selected' : ''}`} onClick={() => setAnswer(pick)}>{pick}</button>)}</div>}
          {step === 0 ? <input className="quiz-input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Viết điều cậu nghĩ nhé" aria-label="Câu trả lời" /> : <textarea className="quiz-input quiz-textarea" maxLength={500} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Cứ viết thật lòng nhé" aria-label="Câu trả lời" />}
          <div className="quiz-card-footer"><span>{step > 0 ? `${answer.length}/500` : 'Một câu ngắn thôi cũng được'}</span><Button type="submit" disabled={!answer.trim()}>Trả lời</Button></div>
        </motion.form> : <motion.div className="quiz-complete" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><p className="eyebrow">MÌNH HIỂU NHAU HƠN MỘT CHÚT</p><h1 id="quiz-title">Cảm ơn cậu đã trả lời</h1><Button onClick={onComplete}>Tiếp tục</Button></motion.div>}
      </section>
    </main>
  )
}

export function TimelineScreen({ items = defaultTimeline }: TimelineScreenProps) {
  const [progress, setProgress] = useState(0)
  const reduceMotion = useReducedMotion()
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function updateProgress() {
      const track = trackRef.current
      if (!track) return
      const bounds = track.getBoundingClientRect()
      const viewport = window.innerHeight
      const distance = Math.max(track.offsetHeight - viewport * 0.48, 1)
      setProgress(Math.min(1, Math.max(0, (viewport * 0.52 - bounds.top) / distance)))
    }
    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <main className={`${pacifico.variable} ${playpen.variable} ${vietnam.variable} timeline-shell`}>
      <div className="timeline-orb timeline-orb-pink" aria-hidden="true" />
      <div className="timeline-orb timeline-orb-blue" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <section className="timeline-content" aria-labelledby="timeline-title">
        <ProgressSegments active={5} total={5} />
        <p className="eyebrow">NHỮNG TRANG MÌNH ĐÃ VIẾT</p>
        <h1 id="timeline-title">Chuyện của chúng mình</h1>
        <div className="timeline-track" ref={trackRef}>
          <div className="timeline-line" aria-hidden="true"><span style={{ height: `${progress * 100}%` }} /></div>
          <div className="timeline-list">
            {items.map((item, index) => <motion.article key={`${item.date}-${item.title}`} className={`timeline-card timeline-card-${index % 2 === 0 ? 'pink' : 'blue'}`} initial={reduceMotion ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .22 }} transition={{ type: 'spring', stiffness: 150, damping: 20 }}>
              <p className="timeline-date">{item.date}</p>
              <h2>{item.title}</h2>
              <p className="timeline-text">{item.text}</p>
              {item.photo && <img src={item.photo} alt={`Kỷ niệm ${item.title}`} />}
            </motion.article>)}
          </div>
        </div>
      </section>
    </main>
  )
}

export function FlipbookScreen({ pages = defaultFlipbookPages, onComplete }: FlipbookScreenProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [page, setPage] = useState(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const [turning, setTurning] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const holdStart = useRef(0)
  const reduceMotion = useReducedMotion()

  function stopHolding() {
    if (holdTimer.current) window.clearInterval(holdTimer.current)
    holdTimer.current = null
    if (!unlocked) setHoldProgress(0)
  }

  function startHolding() {
    if (unlocked) return
    holdStart.current = Date.now()
    holdTimer.current = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - holdStart.current) / 1500)
      setHoldProgress(progress)
      if (progress >= 1) {
        stopHolding()
        setUnlocked(true)
      }
    }, 30)
  }

  function turn(direction: 1 | -1) {
    if (!unlocked || turning) return
    const next = Math.max(0, Math.min(pages.length - 1, page + direction))
    if (next === page) return
    setTurning(true)
    setPage(next)
    window.setTimeout(() => setTurning(false), reduceMotion ? 0 : 520)
  }

  return (
    <main className={`${pacifico.variable} ${playpen.variable} ${vietnam.variable} flipbook-shell`}>
      <div className="flipbook-orb flipbook-orb-pink" aria-hidden="true" />
      <div className="flipbook-orb flipbook-orb-blue" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <section className={`flipbook-content ${unlocked ? 'is-unlocked' : ''}`} aria-labelledby="flipbook-title">
        <ProgressSegments active={5} total={5} />
        {!unlocked ? <>
          <p className="eyebrow">MỘT ĐIỀU NHỎ DÀNH CHO CẬU</p>
          <h1 id="flipbook-title">Mở thư của chúng mình</h1>
          <div className="envelope" aria-label="Phong bì đang khóa">
            <div className="envelope-flap" />
            <div className="wax-seal-wrap">
              <svg className="hold-ring" viewBox="0 0 100 100" aria-hidden="true"><circle className="hold-ring-track" cx="50" cy="50" r="44" /><circle className="hold-ring-progress" cx="50" cy="50" r="44" pathLength="1" style={{ strokeDashoffset: 1 - holdProgress }} /></svg>
              <button className={`wax-seal ${holdProgress === 1 ? 'is-cracked' : ''}`} type="button" onPointerDown={startHolding} onPointerUp={stopHolding} onPointerLeave={stopHolding} onPointerCancel={stopHolding} aria-label="Nhấn và giữ để mở thư">{holdProgress >= 1 ? 'Mở' : 'Giữ'}</button>
            </div>
          </div>
          <p className="hold-hint">Nhấn và giữ con dấu một chút nhé</p>
        </> : <motion.div className="book-stage" initial={reduceMotion ? false : { opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 150, damping: 18 }}>
          <p className="eyebrow">NHỮNG TRANG DÀNH CHO CẬU</p>
          <div className={`book-page ${turning ? 'is-turning' : ''}`} onClick={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); turn(event.clientX - bounds.left > bounds.width / 2 ? 1 : -1) }} onTouchStart={(event) => { (event.currentTarget as HTMLElement).dataset.touchX = String(event.touches[0].clientX) }} onTouchEnd={(event) => { const start = Number((event.currentTarget as HTMLElement).dataset.touchX); const delta = event.changedTouches[0].clientX - start; if (Math.abs(delta) > 30) turn(delta < 0 ? 1 : -1) }}>
            <div className="page-image-backdrop" style={pages[page].image ? { backgroundImage: `url(${pages[page].image})` } : undefined} />
            {pages[page].image ? <img src={pages[page].image} alt={pages[page].alt ?? 'Trang kỷ niệm'} /> : <div className="page-empty">Trang kỷ niệm {page + 1}</div>}
            <button type="button" className="page-edge page-edge-left" aria-label="Trang trước" onClick={(event) => { event.stopPropagation(); turn(-1) }} />
            <button type="button" className="page-edge page-edge-right" aria-label="Trang sau" onClick={(event) => { event.stopPropagation(); turn(1) }} />
          </div>
          <p className="page-counter">{page + 1} / {pages.length}</p>
          <button className="text-action" type="button" onClick={onComplete}>Xem xong rồi</button>
        </motion.div>}
      </section>
    </main>
  )
}

export default function Page() {
  return <FlipbookScreen />
}

export const designTokens = {
  colors: { pink50: '#FFF6F9', pink100: '#FFE3EC', pink300: '#FFB8CC', pink500: '#F27FA5', blue50: '#F3F8FF', blue100: '#DDEBFF', blue300: '#AFCFF7', blue500: '#6EA6E6', cream: '#FFFBF8', ink: '#3A2F4B', inkSoft: '#6B5F80' },
  radius: '28px', buttonHeight: '56px', background: '160deg #FFE3EC → #DDEBFF',
}
