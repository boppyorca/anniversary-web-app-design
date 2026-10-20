import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

async function getSharp() {
  const mod = await import('sharp')
  return mod.default || mod
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

export const GROUPS = [
  { name: 'red', count: 3 },
  { name: 'beige', count: 3 },
  { name: 'green', count: 4 },
  { name: 'black', count: 4 },
  { name: 'blue', count: 1 },
]

export const EXPECTED_PAGE_COUNT = GROUPS.reduce((acc, g) => acc + g.count, 0) // 15

export const PDF_PATH = path.join(rootDir, 'flipbook-source', 'pages.pdf')
export const MEDIA_DIR = path.join(rootDir, 'public', 'media', 'flipbook')
export const MANIFEST_PATH = path.join(rootDir, 'content', 'flipbook.manifest.json')

/**
 * Parses integer page number from file names such as:
 * p-2.png, p-10.png, p-01.png, page-1.png, p01.webp, trang-6.jpg, 06.jpg, etc.
 */
export function parsePageNumber(filename) {
  const match = filename.match(/(?:page|p|trang|img|image|photo)?[_-]?(\d+)\.(?:png|jpe?g|webp)$/i)
  if (!match) return null
  const num = parseInt(match[1], 10)
  if (num > 100) return null
  return num
}

/**
 * Assigns group name based on 1-based page index
 */
export function getGroupName(pageIndex, allowAny = false) {
  if (allowAny) return 'page'
  let currentStart = 1
  for (const group of GROUPS) {
    if (pageIndex >= currentStart && pageIndex < currentStart + group.count) {
      return group.name
    }
    currentStart += group.count
  }
  return 'page'
}

function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function checkTool(cmd) {
  const res = spawnSync('which', [cmd], { encoding: 'utf-8' })
  return res.status === 0
}

export async function processImage(inputBufferOrPath, outPath) {
  const sharp = await getSharp()
  const metadata = await sharp(inputBufferOrPath).metadata()
  const origW = metadata.width || 1000
  const origH = metadata.height || 1000

  let quality = 82
  let finalBuffer = null

  while (quality >= 55) {
    finalBuffer = await sharp(inputBufferOrPath)
      .resize({
        width: origW > origH ? 1400 : undefined,
        height: origH >= origW ? 1400 : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer()

    if (finalBuffer.length <= 180 * 1024) {
      break
    }
    quality -= 6
  }

  fs.writeFileSync(outPath, finalBuffer)

  // Generate 24px blur placeholder
  const blurBuffer = await sharp(finalBuffer)
    .resize(24)
    .webp({ quality: 40 })
    .toBuffer()

  const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`

  const outMeta = await sharp(finalBuffer).metadata()
  return {
    width: outMeta.width || origW,
    height: outMeta.height || origH,
    sizeKB: Math.round(finalBuffer.length / 1024),
    blur: blurDataUrl,
  }
}

export async function runFlipbookBuild(args = process.argv.slice(2)) {
  const force = args.includes('--force')
  const checkOnly = args.includes('--check')
  const allowAny = args.includes('--allow-any')

  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })

  // --- CHECK ONLY MODE ---
  if (checkOnly) {
    console.log('--- Checking Flipbook Manifest & Images ---')
    if (!fs.existsSync(MANIFEST_PATH)) {
      console.error('[LỖI / ERROR] Manifest không tồn tại / Manifest file not found:', MANIFEST_PATH)
      process.exit(1)
    }

    let manifest
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
    } catch (e) {
      console.error('[LỖI / ERROR] Manifest JSON không hợp lệ / Invalid JSON in manifest:', e.message)
      process.exit(1)
    }

    if (!allowAny && manifest.total !== EXPECTED_PAGE_COUNT) {
      console.error(
        `[LỖI / ERROR] Số trang không đúng: kỳ vọng ${EXPECTED_PAGE_COUNT}, nhận được ${manifest.total}`
      )
      process.exit(1)
    }

    if (!Array.isArray(manifest.pages) || manifest.pages.length !== manifest.total) {
      console.error('[LỖI / ERROR] Danh sách pages không khớp với tổng số trang')
      process.exit(1)
    }

    let totalSizeKB = 0
    for (let i = 0; i < manifest.pages.length; i++) {
      const page = manifest.pages[i]
      const expectedIndex = i + 1

      if (page.index !== expectedIndex) {
        console.error(`[LỖI / ERROR] Thứ tự trang bị sai: trang ${page.index} ở vị trí ${expectedIndex}`)
        process.exit(1)
      }

      const filePath = path.join(rootDir, 'public', page.src.replace(/^\//, ''))
      if (!fs.existsSync(filePath)) {
        console.error(`[LỖI / ERROR] File ảnh không tồn tại trên đĩa / File missing: ${page.src}`)
        process.exit(1)
      }

      const stats = fs.statSync(filePath)
      const sizeKB = Math.round(stats.size / 1024)
      totalSizeKB += sizeKB

      if (sizeKB > 200) {
        console.error(`[CẢNH BÁO / ERROR] Ảnh ${page.src} vượt quá 200KB (${sizeKB} KB)`)
        process.exit(1)
      }
    }

    console.log(`[OK] Manifest hợp lệ! Tổng cộng: ${manifest.total} trang (${(totalSizeKB / 1024).toFixed(2)} MB).`)
    return
  }

  // --- BUILD MODE ---
  console.log('--- Building Flipbook Pipeline ---')

  const hasPdf = fs.existsSync(PDF_PATH)
  const existingWebpFiles = fs
    .readdirSync(MEDIA_DIR)
    .filter((f) => /^p\d+\.webp$/i.test(f))
    .sort((a, b) => (parsePageNumber(a) || 0) - (parsePageNumber(b) || 0))

  const sourceDir = path.join(rootDir, 'flipbook-source')
  const sourceImages = fs.existsSync(sourceDir)
    ? fs
        .readdirSync(sourceDir)
        .filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !f.startsWith('.'))
        .sort((a, b) => {
          const numA = parsePageNumber(a)
          const numB = parsePageNumber(b)
          if (numA !== null && numB !== null) return numA - numB
          return a.localeCompare(b, undefined, { numeric: true })
        })
    : []

  let sourceSha256 = ''
  let inputMode = 'pdf' // 'pdf' | 'source-images' | 'partial-source-images' | 'existing-webp'

  if (hasPdf) {
    inputMode = 'pdf'
    const pdfBuf = fs.readFileSync(PDF_PATH)
    sourceSha256 = computeSha256(pdfBuf)
  } else if (sourceImages.length === EXPECTED_PAGE_COUNT || (allowAny && sourceImages.length > 0)) {
    inputMode = 'source-images'
    const hash = crypto.createHash('sha256')
    for (const file of sourceImages) {
      hash.update(fs.readFileSync(path.join(sourceDir, file)))
    }
    sourceSha256 = hash.digest('hex')
  } else if (sourceImages.length > 0 && existingWebpFiles.length > 0) {
    inputMode = 'partial-source-images'
    const hash = crypto.createHash('sha256')
    for (const file of sourceImages) {
      hash.update(fs.readFileSync(path.join(sourceDir, file)))
    }
    for (const file of existingWebpFiles) {
      hash.update(fs.readFileSync(path.join(MEDIA_DIR, file)))
    }
    sourceSha256 = hash.digest('hex')
  } else if (existingWebpFiles.length === EXPECTED_PAGE_COUNT || (allowAny && existingWebpFiles.length > 0)) {
    inputMode = 'existing-webp'
    const hash = crypto.createHash('sha256')
    for (const file of existingWebpFiles) {
      hash.update(fs.readFileSync(path.join(MEDIA_DIR, file)))
    }
    sourceSha256 = hash.digest('hex')
  } else {
    console.error(
      '[LỖI / ERROR] Không tìm thấy nguồn ảnh phù hợp:'
    )
    console.error('  1. File PDF tại "flipbook-source/pages.pdf"')
    console.error(`  2. Hoặc ${EXPECTED_PAGE_COUNT} file ảnh (.png, .jpg, .webp) tại "flipbook-source/" (hiện có: ${sourceImages.length})`)
    console.error(`  3. Hoặc ${EXPECTED_PAGE_COUNT} file ảnh WebP đã chuẩn bị tại "public/media/flipbook/p01.webp" ... "p15.webp" (hiện có: ${existingWebpFiles.length})`)
    process.exit(1)
  }

  // Cache check
  if (!force && fs.existsSync(MANIFEST_PATH)) {
    try {
      const oldManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
      if (oldManifest.sourceSha256 === sourceSha256) {
        const allFilesExist = oldManifest.pages.every((p) =>
          fs.existsSync(path.join(rootDir, 'public', p.src.replace(/^\//, '')))
        )
        if (allFilesExist) {
          console.log('[INFO] Flipbook is up to date (cached). Use --force to rebuild.')
          return
        }
      }
    } catch {
      // Rebuild if invalid manifest
    }
  }

  let rawPages = [] // array of { pageNum, filePath }

  if (inputMode === 'pdf') {
    const hasPoppler = checkTool('pdftoppm')
    const hasMutool = checkTool('mutool')
    const hasMagick = checkTool('magick')

    if (!hasPoppler && !hasMutool && !hasMagick) {
      console.error('\n[LỖI / ERROR] Không tìm thấy công cụ chuyển đổi PDF (poppler, mutool, hoặc ImageMagick).')
      console.error('Hướng dẫn cài đặt poppler:')
      console.error('  • macOS (Homebrew): brew install poppler')
      console.error('  • Windows (winget): winget install poppler')
      console.error('  • Ubuntu/Debian:    sudo apt install poppler-utils\n')
      process.exit(1)
    }

    const tempDir = path.join(MEDIA_DIR, '_temp_ppm')
    fs.mkdirSync(tempDir, { recursive: true })

    try {
      console.log('Đang trích xuất các trang từ PDF bằng pdftoppm...')
      if (hasPoppler) {
        execSync(`pdftoppm -r 110 -png "${PDF_PATH}" "${path.join(tempDir, 'p')}"`, { stdio: 'inherit' })
      } else if (hasMutool) {
        execSync(`mutool draw -r 110 -o "${path.join(tempDir, 'p-%d.png')}" "${PDF_PATH}"`, { stdio: 'inherit' })
      } else {
        execSync(`magick -density 110 "${PDF_PATH}" "${path.join(tempDir, 'p-%d.png')}"`, { stdio: 'inherit' })
      }

      const tempFiles = fs.readdirSync(tempDir).filter((f) => /\.(png|jpe?g)$/i.test(f))

      rawPages = tempFiles
        .map((f) => ({
          pageNum: parsePageNumber(f),
          filePath: path.join(tempDir, f),
        }))
        .filter((item) => item.pageNum !== null)
        .sort((a, b) => a.pageNum - b.pageNum)

      if (!allowAny && rawPages.length !== EXPECTED_PAGE_COUNT) {
        console.error(
          `\n[LỖI / ERROR] Số trang PDF không khớp: PDF có ${rawPages.length} trang, nhưng yêu cầu chính xác ${EXPECTED_PAGE_COUNT} trang.`
        )
        console.error(`(Sử dụng cờ --allow-any nếu bạn muốn chấp nhận số trang khác ${EXPECTED_PAGE_COUNT}).`)
        fs.rmSync(tempDir, { recursive: true, force: true })
        process.exit(1)
      }
    } catch (e) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      throw e
    }
  } else if (inputMode === 'source-images') {
    console.log(`Đang xử lý ${sourceImages.length} ảnh nguồn từ flipbook-source/...`)
    rawPages = sourceImages.map((f, idx) => ({
      pageNum: parsePageNumber(f) ?? (idx + 1),
      filePath: path.join(sourceDir, f),
    }))
  }

  if (inputMode === 'partial-source-images') {
    console.log(`Đang xử lý ${sourceImages.length} ảnh mới từ flipbook-source/ để cập nhật vào Flipbook...`)
    const mapped = new Map()
    const unmapped = []

    for (const f of sourceImages) {
      const p = parsePageNumber(f)
      if (p !== null && p >= 1 && p <= EXPECTED_PAGE_COUNT && !mapped.has(p)) {
        mapped.set(p, path.join(sourceDir, f))
      } else {
        unmapped.push(path.join(sourceDir, f))
      }
    }

    // Determine available slots for unmapped files (prefer pages 6-15, then 1-5)
    const availableSlots = []
    for (let p = 6; p <= EXPECTED_PAGE_COUNT; p++) {
      if (!mapped.has(p)) availableSlots.push(p)
    }
    for (let p = 1; p < 6; p++) {
      if (!mapped.has(p)) availableSlots.push(p)
    }

    for (const filePath of unmapped) {
      const nextSlot = availableSlots.shift()
      if (nextSlot) {
        mapped.set(nextSlot, filePath)
      } else {
        console.warn(`[CẢNH BÁO] Không còn vị trí trống cho file ${path.basename(filePath)}, bỏ qua.`)
      }
    }

    // Process and overwrite mapped webp files
    for (const [pageNum, srcPath] of mapped.entries()) {
      const filename = `p${String(pageNum).padStart(2, '0')}.webp`
      const outPath = path.join(MEDIA_DIR, filename)
      console.log(`  -> Đang chuyển đổi [${path.basename(srcPath)}] thành Trang ${pageNum} (${filename})...`)
      await processImage(srcPath, outPath)
    }

    // Refresh existingWebpFiles list and switch to existing-webp to generate manifest
    existingWebpFiles.length = 0
    existingWebpFiles.push(
      ...fs
        .readdirSync(MEDIA_DIR)
        .filter((f) => /^p\d+\.webp$/i.test(f))
        .sort((a, b) => (parsePageNumber(a) || 0) - (parsePageNumber(b) || 0))
    )
    inputMode = 'existing-webp'
  }

  if (inputMode === 'existing-webp') {
    // Mode B: from existing webp files
    console.log('Sử dụng 15 ảnh WebP có sẵn trong public/media/flipbook/ (bỏ qua bước nén, chỉ tạo manifest)...')
    const manifestPages = []

    for (let i = 0; i < existingWebpFiles.length; i++) {
      const pageIndex = i + 1
      const filename = existingWebpFiles[i]
      const filePath = path.join(MEDIA_DIR, filename)
      const group = getGroupName(pageIndex, allowAny)

      const sharp = await getSharp()
      const meta = await sharp(filePath).metadata()
      const stats = fs.statSync(filePath)
      const sizeKB = Math.round(stats.size / 1024)

      // Generate 24px blur placeholder
      const blurBuffer = await sharp(filePath)
        .resize(24)
        .webp({ quality: 40 })
        .toBuffer()
      const blurDataUrl = `data:image/webp;base64,${blurBuffer.toString('base64')}`

      manifestPages.push({
        index: pageIndex,
        src: `/media/flipbook/${filename}`,
        width: meta.width || 880,
        height: meta.height || 1100,
        group,
        sizeKB,
        blur: blurDataUrl,
      })
    }

    const manifest = {
      generatedAt: new Date().toISOString(),
      sourceSha256,
      total: manifestPages.length,
      pages: manifestPages,
    }

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8')
    console.log(`\nĐã ghi manifest tại: ${MANIFEST_PATH}`)

    // Summary Table
    console.log('\n=== TỔNG KẾT BẢNG TRANG FLIPBOOK (FLIPBOOK SUMMARY) ===')
    const tableData = manifestPages.map((p) => ({
      'Trang (Index)': p.index,
      'Nhóm (Group)': p.group,
      'Kích thước (WxH)': `${p.width}x${p.height}`,
      'Dung lượng (KB)': `${p.sizeKB} KB`,
    }))
    console.table(tableData)

    const totalKB = manifestPages.reduce((acc, p) => acc + p.sizeKB, 0)
    const totalMB = (totalKB / 1024).toFixed(2)
    console.log(`Tổng dung lượng: ${totalMB} MB (${totalKB} KB)`)
    console.log('\n[SUCCESS] Hoàn tất chuẩn bị Flipbook!')
    return
  }

  // Convert to WebP and build manifest pages
  const manifestPages = []
  const generatedFileNames = new Set()

  console.log('\nĐang xử lý và nén ảnh sang chuẩn WebP...')
  for (let i = 0; i < rawPages.length; i++) {
    const pageIndex = i + 1
    const filename = `p${String(pageIndex).padStart(2, '0')}.webp`
    const outPath = path.join(MEDIA_DIR, filename)
    generatedFileNames.add(filename)

    const raw = rawPages[i]
    const group = getGroupName(pageIndex, allowAny)

    const { width, height, sizeKB, blur } = await processImage(raw.filePath, outPath)

    manifestPages.push({
      index: pageIndex,
      src: `/media/flipbook/${filename}`,
      width,
      height,
      group,
      sizeKB,
      blur,
    })
  }

  // Clean up temp directory if used
  const tempDir = path.join(MEDIA_DIR, '_temp_ppm')
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }

  // Remove stale p*.webp files
  const currentMediaFiles = fs.readdirSync(MEDIA_DIR)
  for (const f of currentMediaFiles) {
    if (/^p\d+\.webp$/i.test(f) && !generatedFileNames.has(f)) {
      console.log(`Xóa file thừa: ${f}`)
      fs.unlinkSync(path.join(MEDIA_DIR, f))
    }
  }

  // Write manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceSha256,
    total: manifestPages.length,
    pages: manifestPages,
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8')
  console.log(`\nĐã ghi manifest tại: ${MANIFEST_PATH}`)

  // Summary Table
  console.log('\n=== TỔNG KẾT BẢNG TRANG FLIPBOOK (FLIPBOOK SUMMARY) ===')
  const tableData = manifestPages.map((p) => ({
    'Trang (Index)': p.index,
    'Nhóm (Group)': p.group,
    'Kích thước (WxH)': `${p.width}x${p.height}`,
    'Dung lượng (KB)': `${p.sizeKB} KB`,
  }))
  console.table(tableData)

  const totalKB = manifestPages.reduce((acc, p) => acc + p.sizeKB, 0)
  const totalMB = (totalKB / 1024).toFixed(2)
  console.log(`Tổng dung lượng: ${totalMB} MB (${totalKB} KB)`)

  if (totalKB > 3072) {
    console.warn(`[CẢNH BÁO / WARNING] Tổng dung lượng vượt quá 3 MB (${totalMB} MB)!`)
  }

  const largePages = manifestPages.filter((p) => p.sizeKB > 200)
  if (largePages.length > 0) {
    console.warn(`[CẢNH BÁO / WARNING] Có ${largePages.length} trang có dung lượng > 200 KB!`)
  }

  console.log('\n[SUCCESS] Hoàn tất chuẩn bị Flipbook!')
}

// Execute CLI if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runFlipbookBuild().catch((err) => {
    console.error('[LỖI / ERROR]:', err)
    process.exit(1)
  })
}
