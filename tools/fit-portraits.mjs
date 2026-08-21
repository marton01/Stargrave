// Fit downloaded portraits to the size the interface actually uses.
//
// A portrait is drawn at 30x30 (see `.portrait` in styles.css), so the asset
// list asks for 256x256. Generated or stock art arrives at something else
// entirely — 1122x1402 and two megabytes is typical — and that costs twice:
// the browser downloads and decodes a megapixel for a thumbnail, and
// `object-fit: cover` crops a non-square picture wherever it happens to fall,
// which for a standing figure is usually across the head.
//
// So: find the subject, cut a square around it, scale it to 256, save webp.
//
// The originals are not touched, only moved: they go to `assets-src/portraits`,
// which is outside `public` and therefore never copied into the build. That
// folder is the source of truth, so the tool is re-runnable — it regenerates
// every output from the originals every time.
//
// The decoding, scaling and encoding are done by the headless Chrome that is
// already here for the smoke test, so this adds no dependency of its own.
//
// Usage:  npm run assets:fit                       (everything that needs it)
//         node tools/fit-portraits.mjs enemy-ash-husk
//         node tools/fit-portraits.mjs enemy-ash-husk --rect 130,170,900,900
//
// The last form is the escape hatch: the automatic crop is a heuristic, and
// when it frames something badly the log prints the rectangle it chose so you
// can pass a better one by hand.

import { chromium } from 'playwright-core'
import { mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const OUT = 'public/assets/portraits'
const SRC = 'assets-src/portraits'
const SIZE = Number(process.env.FIT_SIZE ?? 256)
const QUALITY = 0.92

// How much room to leave around the subject: to the sides as a fraction of its
// width, above and below as a fraction of its height. The sides get more,
// because a subject pressed against the left and right edges of a square looks
// cramped in a way that a bit of headroom does not fix.
const SIDE_MARGIN = 0.15
const VERTICAL_MARGIN = 0.06

// Where the top of a subject too tall to fit sits inside the square.
const TOP_MARGIN = 0.05

const READABLE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }

const args = process.argv.slice(2)
const rectIndex = args.indexOf('--rect')
const manualRect = rectIndex >= 0 ? args[rectIndex + 1].split(',').map(Number) : null
const only = args.filter((a, i) => !a.startsWith('--') && i !== rectIndex + 1)

if (manualRect && (manualRect.length !== 4 || manualRect.some((n) => !Number.isFinite(n)))) {
  console.log('--rect wants four numbers: x,y,width,height')
  process.exit(1)
}
if (manualRect && only.length !== 1) {
  console.log('--rect applies to one named portrait, e.g. enemy-ash-husk --rect 130,170,900,900')
  process.exit(1)
}

mkdirSync(SRC, { recursive: true })
mkdirSync(OUT, { recursive: true })

const base = (file) => file.slice(0, -extname(file).length)

function images(dir) {
  return readdirSync(dir)
    .filter((f) => READABLE.has(extname(f).toLowerCase()))
    .filter((f) => only.length === 0 || only.includes(base(f)))
    .sort()
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage()

/**
 * What is in this picture: its size, and the box the subject occupies.
 *
 * The subject is whatever is brighter than the background. These portraits sit
 * on a dark ground by request, often with a soft mist over it, so a fixed
 * threshold would either swallow the mist or lose the dimmer edges of the
 * figure. The threshold is therefore taken from the picture itself: a quarter
 * of the way from the median brightness up to the top of the range. Where the
 * background is transparent instead of dark, alpha answers the question
 * outright.
 *
 * The box is then found from where the brightness *mass* is, not from the
 * outermost pixel that clears the threshold. A haze drifting to the edge of the
 * frame is over the threshold too, and a plain bounding box therefore comes out
 * the full width of the picture almost every time — which is how a standing
 * figure ends up as a thin smudge at 30 pixels.
 *
 * So each column and each row is summed, and the box is where those sums rise to
 * a fraction of their own peak. Haze is a broad, low plateau and never gets near
 * the peak; a figure is a narrow, high hill. Comparing against the peak rather
 * than against a share of the total is what separates the two, because a wide
 * enough plateau can hold a lot of the total while never being bright anywhere.
 *
 * The top edge uses a lower fraction than the sides: the top of the box is the
 * top of the head, a head carries little mass next to a torso, and the coarser
 * cut slices it off.
 *
 * The scan runs on a downscaled copy. A box that is a pixel or two out makes no
 * difference to a crop, and it keeps the pixel loop small.
 */
async function inspect(path) {
  const data = `data:${MIME[extname(path).toLowerCase()]};base64,${readFileSync(path).toString('base64')}`
  return page.evaluate(async (data) => {
    const img = new Image()
    img.src = data
    await img.decode()

    const SCAN = 256
    const scale = Math.min(1, SCAN / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, w, h)
    const px = ctx.getImageData(0, 0, w, h).data

    let transparent = false
    const lum = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      const a = px[i * 4 + 3]
      if (a < 250) transparent = true
      lum[i] = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]
    }

    let threshold = 0
    let weight
    if (transparent) {
      weight = (i) => (px[i * 4 + 3] > 24 ? px[i * 4 + 3] / 255 : 0)
    } else {
      const sorted = Float32Array.from(lum).sort()
      const median = sorted[Math.floor(sorted.length * 0.5)]
      const top = sorted[Math.floor(sorted.length * 0.99)]
      threshold = median + (top - median) * 0.25
      weight = (i) => Math.max(0, lum[i] - threshold)
    }

    const columns = new Float64Array(w)
    const rows = new Float64Array(h)
    let total = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const m = weight(y * w + x)
        if (m <= 0) continue
        columns[x] += m
        rows[y] += m
        total += m
      }
    }

    /** Where a profile first and last reaches `nearStart` / `nearEnd` of its peak. */
    const span = (mass, nearStart, nearEnd) => {
      let peak = 0
      for (const m of mass) if (m > peak) peak = m
      let start = 0
      let end = mass.length
      for (let i = 0; i < mass.length; i++) {
        if (mass[i] >= peak * nearStart) {
          start = i
          break
        }
      }
      for (let i = mass.length - 1; i >= 0; i--) {
        if (mass[i] >= peak * nearEnd) {
          end = i + 1
          break
        }
      }
      return [start / mass.length, end / mass.length]
    }

    if (total <= 0) {
      return { width: img.naturalWidth, height: img.naturalHeight, threshold: 0, transparent, bounds: { x0: 0, y0: 0, x1: 1, y1: 1 } }
    }
    const [x0, x1] = span(columns, 0.22, 0.22)
    const [y0, y1] = span(rows, 0.08, 0.22)

    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      threshold: Math.round(threshold),
      transparent,
      // Normalised, so the caller can work in source pixels without caring
      // what the scan was scaled to.
      bounds: { x0, y0, x1, y1 },
    }
  }, data)
}

/**
 * The square to cut, in source pixels.
 *
 * Big enough to hold the whole subject with a margin, and no bigger — that is
 * what makes a thumbnail read: the subject fills the frame instead of floating
 * in the middle of its own empty background. Usually the subject's width sets
 * the size; when it is the taller way round, its height does, so that nothing
 * gets cut off just because the picture is a square and the subject is not.
 *
 * Where the square sits vertically depends on whether it can hold the whole
 * subject. A figure taller than the whole picture is wide gets the square at its
 * top, which is the head-and-shoulders framing a portrait wants. Everything else
 * is centred on the subject, because a top anchor there would leave empty air
 * above the head and cut something off the bottom instead — and what is at the
 * bottom of a subject is often the thing that makes it recognisable, an ember in
 * the chest or a tool in a hand.
 */
function squareCrop({ width, height, bounds }) {
  const x0 = bounds.x0 * width
  const x1 = bounds.x1 * width
  const y0 = bounds.y0 * height
  const y1 = bounds.y1 * height

  const limit = Math.min(width, height)
  const side = Math.min(
    limit,
    Math.round(Math.max((x1 - x0) * (1 + 2 * SIDE_MARGIN), (y1 - y0) * (1 + 2 * VERTICAL_MARGIN))),
  )
  const centreX = (x0 + x1) / 2
  const taller = y1 - y0 > side
  const top = taller ? y0 - side * TOP_MARGIN : (y0 + y1) / 2 - side / 2

  const clamp = (v, max) => Math.max(0, Math.min(Math.round(v), max - side))
  return { x: clamp(centreX - side / 2, width), y: clamp(top, height), side }
}

/** Cut, scale, encode. */
async function fit(path, rect) {
  const data = `data:${MIME[extname(path).toLowerCase()]};base64,${readFileSync(path).toString('base64')}`
  const url = await page.evaluate(
    async ([data, x, y, side, size, quality]) => {
      const img = new Image()
      img.src = data
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, x, y, side, side, 0, 0, size, size)
      return canvas.toDataURL('image/webp', quality)
    },
    [data, rect.x, rect.y, rect.side, SIZE, QUALITY],
  )
  return Buffer.from(url.split(',')[1], 'base64')
}

// ---------------------------------------------------------------------------
// 1. Anything in the served folder that is not already a fitted picture is an
//    original that has not been through here yet. Move it to the source folder.

const kept = []
for (const file of images(OUT)) {
  const path = join(OUT, file)
  const { width, height } = await inspect(path)
  if (extname(file).toLowerCase() === '.webp' && width === height && width <= SIZE) {
    kept.push(`${file} — already ${width}x${height}, left alone`)
    continue
  }
  renameSync(path, join(SRC, file))
}

// 2. Regenerate every output from the originals.

const rows = []
for (const file of images(SRC)) {
  const path = join(SRC, file)
  const info = await inspect(path)
  const rect = manualRect
    ? { x: manualRect[0], y: manualRect[1], side: Math.min(manualRect[2], manualRect[3]) }
    : squareCrop(info)
  const out = join(OUT, `${base(file)}.webp`)
  writeFileSync(out, await fit(path, rect))
  const pct = (v) => `${Math.round(v * 100)}%`
  rows.push({
    name: base(file),
    from: `${info.width}x${info.height}`,
    was: statSync(path).size / 1024,
    subject: manualRect
      ? 'by hand'
      : `x ${pct(info.bounds.x0)}-${pct(info.bounds.x1)} y ${pct(info.bounds.y0)}-${pct(info.bounds.y1)}`,
    crop: `${rect.x},${rect.y} ${rect.side}px`,
    now: statSync(out).size / 1024,
  })
}

await browser.close()

if (manualRect && manualRect[2] !== manualRect[3]) {
  console.log(`Note: --rect was ${manualRect[2]}x${manualRect[3]}; the shorter side won, since the output is square.`)
}

const pad = (s, n) => String(s).padEnd(n)
console.log(`${pad('portrait', 26)}${pad('source', 12)}${pad('was', 10)}${pad('subject found', 28)}${pad('crop', 18)}now`)
for (const r of rows) {
  console.log(
    pad(r.name, 26) +
      pad(r.from, 12) +
      pad(`${r.was.toFixed(0)} KB`, 10) +
      pad(r.subject, 28) +
      pad(r.crop, 18) +
      `${r.now.toFixed(1)} KB`,
  )
}
for (const k of kept) console.log(k)
console.log('')
console.log(`Fitted:    ${rows.length} -> ${OUT} (${SIZE}x${SIZE} webp)`)
console.log(`Originals: ${SRC}`)
if (rows.length) {
  console.log('')
  console.log('Look at them at 30x30 in the game. If a crop framed something badly:')
  console.log(`  node tools/fit-portraits.mjs ${rows[0].name} --rect x,y,width,height`)
}
