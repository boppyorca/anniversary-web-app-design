'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DesignSystemDemo() {
  const [soundOn, setSoundOn] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 280, damping: 24 }

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 text-ink">
      <div className="blob blob-pink" aria-hidden="true" />
      <div className="blob blob-blue" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[792px] w-full max-w-[390px] flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            <span className="size-2 rounded-full bg-pink-500" />
            Mẫu giao diện
          </div>
          <button aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'} className="icon-button" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </button>
        </header>

        <section className="flex flex-col gap-3 pt-4">
          <p className="font-hand text-lg text-pink-500">Kỷ niệm của chúng mình</p>
          <h1 className="font-display text-5xl leading-[0.98] tracking-tight">Gửi em,<br />người anh yêu.</h1>
          <p className="max-w-[290px] text-sm leading-6 text-ink-soft">Một khoảng trời nhỏ để lưu giữ những ngày mình đã cùng nhau đi qua.</p>
        </section>

        <Card className="flex flex-col gap-5 bg-cream/85">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Chặng đường</p>
              <p className="mt-1 font-hand text-2xl text-ink">Câu chuyện của mình</p>
            </div>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-500">03 / 05</span>
          </div>
          <ProgressSegments active={3} total={5} />
          <p className="text-sm leading-6 text-ink-soft">Mỗi khoảnh khắc đều là một mảnh ghép dịu dàng.</p>
          <Button className="w-full" onClick={() => setSheetOpen(true)}>Mở kỷ niệm <ArrowRight data-icon="inline-end" /></Button>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="min-h-[150px] bg-pink-50/75">
            <span className="font-display text-3xl text-pink-500">365</span>
            <p className="mt-2 text-xs leading-5 text-ink-soft">ngày cùng nhau<br />lớn lên</p>
          </Card>
          <Card className="min-h-[150px] bg-blue-50/75">
            <span className="font-display text-3xl text-blue-500">∞</span>
            <p className="mt-2 text-xs leading-5 text-ink-soft">điều nhỏ bé<br />anh yêu ở em</p>
          </Card>
        </div>

        <Card className="gap-4 bg-white/55">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">Một lời nhắn</p>
            <p className="mt-1 font-hand text-2xl">Viết điều muốn nói</p>
          </div>
          <Input placeholder="Em à, anh muốn nói rằng..." />
        </Card>

        <p className="mt-auto text-center font-hand text-base text-ink-soft">Mãi là chúng mình nhé.</p>
      </div>

      <AnimatePresence>
        {sheetOpen && <BottomSheet onClose={() => setSheetOpen(false)} transition={transition} />}
      </AnimatePresence>
    </main>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col rounded-[28px] border border-white/70 p-5 shadow-card backdrop-blur-sm ${className}`}>{children}</div>
}

export function Input({ placeholder }: { placeholder?: string }) {
  return <input className="h-14 w-full rounded-2xl border border-pink-100 bg-white/75 px-4 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-pink-300 focus:ring-4 focus:ring-pink-100" placeholder={placeholder} aria-label={placeholder} />
}

export function ProgressSegments({ active, total }: { active: number; total: number }) {
  return <div className="flex gap-1.5" aria-label={`Đã hoàn thành ${active} trên ${total} chặng`} role="progressbar" aria-valuenow={active} aria-valuemin={0} aria-valuemax={total}>{Array.from({ length: total }).map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < active ? 'bg-pink-500' : 'bg-pink-100'}`} />)}</div>
}

function BottomSheet({ onClose, transition }: { onClose: () => void; transition: object }) {
  return <motion.div className="fixed inset-0 z-10 flex items-end justify-center bg-ink/15 px-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.div className="w-full max-w-[390px] rounded-t-[32px] bg-cream p-6 pb-8 shadow-sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={transition} role="dialog" aria-modal="true" aria-labelledby="memory-title">
      <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-pink-300" />
      <div className="flex items-start justify-between gap-4">
        <div><p className="font-hand text-lg text-pink-500">Ngày đầu tiên</p><h2 id="memory-title" className="mt-1 font-display text-4xl">Mình gặp nhau</h2></div>
        <button aria-label="Đóng" className="icon-button" onClick={onClose}><X aria-hidden="true" /></button>
      </div>
      <p className="mt-6 text-sm leading-7 text-ink-soft">Anh vẫn nhớ cảm giác hôm ấy — một buổi chiều rất dịu, và nụ cười của em làm mọi thứ quanh mình chậm lại.</p>
      <Button className="mt-6 w-full" onClick={onClose}>Tiếp tục <ArrowRight data-icon="inline-end" /></Button>
    </motion.div>
  </motion.div>
}
