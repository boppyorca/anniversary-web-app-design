import { execSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync, writeFileSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const sourceVideo = path.join(rootDir, 'video-source', 'original.mp4')
const outputDir = path.join(rootDir, 'public', 'media')
const outputVideo = path.join(outputDir, 'intro.mp4')
const outputPoster = path.join(outputDir, 'intro-poster.webp')
const outputJson = path.join(outputDir, 'intro.json')

function checkCommand(cmd) {
  const res = spawnSync('which', [cmd], { encoding: 'utf-8' })
  return res.status === 0
}

async function run() {
  console.log('--- Video Preparation Pipeline ---')

  // 1. Check if ffmpeg & ffprobe exist
  const hasFfmpeg = checkCommand('ffmpeg')
  const hasFfprobe = checkCommand('ffprobe')

  if (!hasFfmpeg || !hasFfprobe) {
    console.log('\n[INFO] ffmpeg or ffprobe is not installed on this system.')
    console.log('To install ffmpeg:')
    console.log('  • macOS (Homebrew): brew install ffmpeg')
    console.log('  • Ubuntu/Debian:    sudo apt update && sudo apt install ffmpeg')
    console.log('  • Windows (winget): winget install Gyan.FFmpeg\n')
    console.log('Skipping video preparation (exit 0).')
    process.exit(0)
  }

  // 2. Check source video
  if (!existsSync(sourceVideo)) {
    console.log(`\n[INFO] Source video not found at: ${sourceVideo}`)
    console.log('Please place your original video at video-source/original.mp4 to run preparation.')
    console.log('Skipping video preparation (exit 0).')
    process.exit(0)
  }

  mkdirSync(outputDir, { recursive: true })

  // 3. Encode video to H.264
  console.log(`\nEncoding ${sourceVideo} -> ${outputVideo}...`)

  const scaleFilter = "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'"

  function encode(crf) {
    console.log(`Running ffmpeg with crf ${crf}, preset slow...`)
    const cmd = [
      'ffmpeg',
      '-y',
      '-i',
      `"${sourceVideo}"`,
      '-c:v',
      'libx264',
      '-profile:v',
      'high',
      '-pix_fmt',
      'yuv420p',
      '-vf',
      `"${scaleFilter}"`,
      '-r',
      '30',
      '-crf',
      String(crf),
      '-preset',
      'slow',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ac',
      '2',
      '-movflags',
      '+faststart',
      `"${outputVideo}"`,
    ].join(' ')

    execSync(cmd, { stdio: 'inherit' })
  }

  // Check if output video already exists and is <= 30MB
  let needsEncode = true
  if (existsSync(outputVideo)) {
    const existingStats = statSync(outputVideo)
    const existingMB = existingStats.size / (1024 * 1024)
    if (existingMB > 0 && existingMB <= 30) {
      console.log(`Existing encoded video found (${existingMB.toFixed(2)} MB <= 30 MB). Skipping re-encode.`)
      needsEncode = false
    }
  }

  if (needsEncode) {
    encode(26)
    let stats = statSync(outputVideo)
    let sizeMB = stats.size / (1024 * 1024)
    console.log(`Output size: ${sizeMB.toFixed(2)} MB`)

    if (sizeMB > 30) {
      console.log(`File size > 30MB (${sizeMB.toFixed(2)} MB). Retrying with CRF 28...`)
      encode(28)
      stats = statSync(outputVideo)
      sizeMB = stats.size / (1024 * 1024)
      console.log(`Final output size with CRF 28: ${sizeMB.toFixed(2)} MB`)
    }
  }

  const finalStats = statSync(outputVideo)
  const sizeMB = finalStats.size / (1024 * 1024)

  // 4. Generate Poster at 3s in WebP format
  console.log(`\nGenerating poster -> ${outputPoster}...`)
  const posterScaleFilter = "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'"
  const tempPoster = path.join(outputDir, 'intro-poster-temp.jpg')

  try {
    const extractCmd = [
      'ffmpeg',
      '-y',
      '-ss',
      '00:00:03',
      '-i',
      `"${outputVideo}"`,
      '-vframes',
      '1',
      '-vf',
      `"${posterScaleFilter}"`,
      '-q:v',
      '2',
      `"${tempPoster}"`,
    ].join(' ')
    execSync(extractCmd, { stdio: 'inherit' })
  } catch (err) {
    console.warn('Failed at 3s, trying at 0.5s...')
    const fallbackExtractCmd = [
      'ffmpeg',
      '-y',
      '-ss',
      '00:00:00.500',
      '-i',
      `"${outputVideo}"`,
      '-vframes',
      '1',
      '-vf',
      `"${posterScaleFilter}"`,
      '-q:v',
      '2',
      `"${tempPoster}"`,
    ].join(' ')
    execSync(fallbackExtractCmd, { stdio: 'inherit' })
  }

  // Convert temp image to WebP with quality 80 using sharp
  try {
    const { default: sharp } = await import('sharp')
    await sharp(tempPoster).webp({ quality: 80 }).toFile(outputPoster)
    console.log(`WebP poster created at: ${outputPoster}`)
    if (existsSync(tempPoster)) unlinkSync(tempPoster)
  } catch (sharpErr) {
    console.warn('Sharp conversion failed, keeping temp jpg as poster fallback:', sharpErr.message)
  }

  // 5. Read metadata via ffprobe and save intro.json
  console.log(`\nReading metadata via ffprobe -> ${outputJson}...`)
  const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -show_entries format=duration,size -of json "${outputVideo}"`
  const probeOutput = execSync(probeCmd, { encoding: 'utf-8' })
  const probeData = JSON.parse(probeOutput)

  const stream = probeData.streams?.[0] || {}
  const format = probeData.format || {}

  const width = stream.width || 0
  const height = stream.height || 0
  const duration = parseFloat(stream.duration || format.duration || '0')
  const finalSizeMB = parseFloat(sizeMB.toFixed(2))

  const meta = {
    width,
    height,
    duration: Math.round(duration * 100) / 100,
    sizeMB: finalSizeMB,
    aspectRatio: width && height ? `${width}:${height}` : 'unknown',
    isVertical: height > width,
  }

  writeFileSync(outputJson, JSON.stringify(meta, null, 2), 'utf-8')
  console.log('Video metadata:', meta)
  console.log('\n[SUCCESS] Video preparation completed!')
}

run()
