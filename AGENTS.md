# Agent Rules & Architecture Guidelines

## Project Context
Romantic 7-stage anniversary web application (Next.js 16 App Router, React 19, Tailwind v4, framer-motion, pnpm, shadcn/base-ui).
Mobile-first (390x844 base, supporting 360px and 430px, desktop 430px centered column via CSS container).
Private link for one recipient.

## Visual Language & Design Rules
- Palette:
  - pink-50: #FFF6F9, pink-100: #FFE3EC, pink-300: #FFB8CC, pink-500: #F27FA5
  - blue-50: #F3F8FF, blue-100: #DDEBFF, blue-300: #AFCFF7, blue-500: #6EA6E6
  - cream: #FFFBF8, ink: #3A2F4B, ink-soft: #6B5F80
- Fonts:
  - Pacifico (short display words)
  - Playpen Sans (handwriting)
  - Be Vietnam Pro (UI/body)
  - Subsets: ['vietnamese', 'latin']
  - Loaded ONCE in `app/layout.tsx` on `<html lang="vi">`.
- Tone & Voice:
  - Speaks as "anh" to "em". Never use "cậu" or "mình-cậu".
- Motion & Animation:
  - Only animate `transform` and `opacity` (plus filter on orbs).
  - Strictly respect `prefers-reduced-motion` (fallback: 200ms opacity fade, no parallax, no confetti).
  - AppBackground is persistent and crossfades stage gradients; never unmount background or restart orbs between stages.
- Icons:
  - No emoji, no sticker packs.
  - Allowed: thin arrow, close, sound on/off, and ONE heart made from SVG shapes in Quiz stage.

## Content & Privacy Rules
- No third-party tracking or analytics (no `@vercel/analytics`, no telemetry).
- No external hosts for media or fonts (self-hosted fonts via `next/font`).
- All network calls (`lib/api.ts`) are fire-and-forget; the UI must NEVER block on network.
- No invented personal love letters, promises, or coupons. Keep copy neutral in `content/content.ts` and track required customization in `CONTENT_TODO.md`.

## Stage Engine Order (Fixed)
1. gate
2. counter
3. video
4. quiz
5. timeline
6. flipbook
7. finale

Stage signature: `({ onComplete }: { onComplete: () => void })`.
State is persisted to localStorage under `"anniv:v1:progress"`.
Failed network requests are enqueued under `"anniv:v1:queue"`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
