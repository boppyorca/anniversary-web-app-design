import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const mediaDir = path.join(rootDir, 'public', 'media', 'flipbook')

fs.mkdirSync(mediaDir, { recursive: true })

const specs = [
  // pages 1-3: red (square 1:1)
  { group: 'red', w: 880, h: 880, bg: '#9E2A2B', fg: '#FFF6F9' },
  { group: 'red', w: 880, h: 880, bg: '#B33939', fg: '#FFF6F9' },
  { group: 'red', w: 880, h: 880, bg: '#8B0000', fg: '#FFF6F9' },
  // pages 4-6: beige (tall 9:16)
  { group: 'beige', w: 720, h: 1280, bg: '#F7E1D7', fg: '#3A2F4B' },
  { group: 'beige', w: 720, h: 1280, bg: '#EAD5C3', fg: '#3A2F4B' },
  { group: 'beige', w: 720, h: 1280, bg: '#F4ECE1', fg: '#3A2F4B' },
  // pages 7-10: green (4:5)
  { group: 'green', w: 880, h: 1100, bg: '#2D5A27', fg: '#FFFBF8' },
  { group: 'green', w: 880, h: 1100, bg: '#3B6E34', fg: '#FFFBF8' },
  { group: 'green', w: 880, h: 1100, bg: '#254B20', fg: '#FFFBF8' },
  { group: 'green', w: 880, h: 1100, bg: '#1E3D1A', fg: '#FFFBF8' },
  // pages 11-14: black (4:5)
  { group: 'black', w: 880, h: 1100, bg: '#1E172A', fg: '#FFE3EC' },
  { group: 'black', w: 880, h: 1100, bg: '#241D33', fg: '#FFE3EC' },
  { group: 'black', w: 880, h: 1100, bg: '#161120', fg: '#FFE3EC' },
  { group: 'black', w: 880, h: 1100, bg: '#2A223B', fg: '#FFE3EC' },
  // page 15: blue (4:5)
  { group: 'blue', w: 880, h: 1100, bg: '#2C5E8A', fg: '#F3F8FF' },
]

async function seed() {
  console.log('Seeding flipbook images (preserving pages 1-5, styling placeholders for 6-15)...')
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i]
    const pageNum = i + 1
    const filename = `p${String(pageNum).padStart(2, '0')}.webp`
    const outPath = path.join(mediaDir, filename)

    // Only generate placeholders for pages that do not yet have real uploaded photos (pageNum >= 6)
    if (pageNum <= 5 && fs.existsSync(outPath)) {
      console.log(`Preserving real photo: ${filename}`)
      continue
    }

    const svg = `
      <svg width="${s.w}" height="${s.h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad${pageNum}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFE3EC"/>
            <stop offset="50%" stop-color="#FFFBF8"/>
            <stop offset="100%" stop-color="#DDEBFF"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad${pageNum})"/>
        <rect x="24" y="24" width="${s.w - 48}" height="${s.h - 48}" rx="28" fill="#FFFBF8" stroke="#FFB8CC" stroke-width="4" stroke-dasharray="12 12"/>
        
        <!-- Romantic Heart Shape -->
        <g transform="translate(${s.w / 2 - 50}, ${s.h / 2 - 90}) scale(0.8)">
          <path d="M 60 20 C 30 -20, -10 15, -10 50 C -10 90, 60 140, 60 140 C 60 140, 130 90, 130 50 C 130 15, 90 -20, 60 20 Z" fill="#F27FA5" opacity="0.65"/>
        </g>

        <text x="50%" y="${s.h / 2 + 65}" font-family="sans-serif" font-size="40" font-weight="bold" fill="#3A2F4B" text-anchor="middle">
          Trang kỷ niệm ${pageNum} / 15
        </text>
        <text x="50%" y="${s.h / 2 + 115}" font-family="sans-serif" font-size="24" fill="#6B5F80" text-anchor="middle">
          (Chờ thêm ảnh của hai đứa mình...)
        </text>
        <text x="50%" y="${s.h / 2 + 160}" font-family="sans-serif" font-size="18" fill="#F27FA5" text-anchor="middle">
          Nhóm [${s.group.toUpperCase()}]
        </text>
      </svg>
    `

    await sharp(Buffer.from(svg))
      .webp({ quality: 82 })
      .toFile(outPath)
    console.log(`Created placeholder ${filename} (${s.w}x${s.h})`)
  }
}

seed()
