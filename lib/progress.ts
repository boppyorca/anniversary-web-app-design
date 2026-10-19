export const STAGE_IDS = [
  'gate',
  'counter',
  'video',
  'quiz',
  'timeline',
  'flipbook',
  'finale',
] as const

export type StageId = (typeof STAGE_IDS)[number]

export interface StageInfo {
  id: StageId
  label: string
}

export const STAGES: StageInfo[] = [
  { id: 'gate', label: 'Cổng mở khóa' },
  { id: 'counter', label: 'Ngày bên nhau' },
  { id: 'video', label: 'Thước phim' },
  { id: 'quiz', label: 'Gắn kết' },
  { id: 'timeline', label: 'Chặng đường' },
  { id: 'flipbook', label: 'Mở thư' },
  { id: 'finale', label: 'Lời nhắn gửi' },
]

export interface ProgressState {
  index: number
  unlocked: number
}

const STORAGE_KEY = 'anniv:v1:progress'

export function loadProgress(): ProgressState {
  if (typeof window === 'undefined') {
    return { index: 0, unlocked: 0 }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { index: 0, unlocked: 0 }
    const parsed = JSON.parse(raw)
    const index = typeof parsed.index === 'number' ? Math.max(0, Math.min(parsed.index, STAGES.length - 1)) : 0
    const unlocked = typeof parsed.unlocked === 'number' ? Math.max(0, Math.min(parsed.unlocked, STAGES.length - 1)) : 0
    return { index: Math.min(index, unlocked), unlocked }
  } catch {
    return { index: 0, unlocked: 0 }
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage quota or disabled storage
  }
}
