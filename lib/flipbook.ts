import type { FlipbookPageMeta } from '@/types/flipbook'

export type Sheet =
  | { kind: 'cover' }
  | { kind: 'page'; page: FlipbookPageMeta }
  | { kind: 'notes' }
  | { kind: 'back' }

export interface FlipbookContentInput {
  pages: FlipbookPageMeta[]
  coverTitle?: string
  backTitle?: string
  notesText?: string
}

export function buildSheets(contentInput: FlipbookContentInput): Sheet[] {
  const pages = contentInput.pages || []
  const sheets: Sheet[] = [
    { kind: 'cover' },
    ...pages.map((page) => ({ kind: 'page' as const, page })),
    { kind: 'notes' },
    { kind: 'back' },
  ]

  if (process.env.NODE_ENV !== 'production' && sheets.length !== 18) {
    throw new Error(
      `[Flipbook] Expected exactly 18 sheets (1 cover + 15 pages + 1 notes + 1 back), but got ${sheets.length} (pages count: ${pages.length}).`
    )
  }

  return sheets
}
