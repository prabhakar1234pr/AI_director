// Smart placement: pick a region of a panel image where overlay text won't
// cover the focal subject (faces, characters). We don't ship a face-detection
// model — instead we use a *saliency heuristic* on a downscaled copy of the
// image:
//
//   1. Render the base64 image into a small offscreen canvas (96×54).
//   2. Compute per-pixel "busyness" = local edge magnitude (|dx| + |dy| of
//      grayscale).
//   3. Score candidate text-box regions by their average busyness. Faces have
//      lots of high-contrast edges, so low-busyness zones tend to be sky,
//      walls, blur — exactly where comic letterers actually put captions.
//   4. Pick the lowest-scoring region.
//
// This isn't perfect, but it's deterministic, fast (sub-ms after decode), and
// good enough that captions stop landing on faces in most generated panels.

const SAMPLE_W = 96
const SAMPLE_H = 54

// Candidate box regions, expressed as fractional bounding boxes inside the
// panel ({x0, y0, x1, y1} all in [0, 1]). The keys are returned to the caller
// and used by the layout to position the actual DOM element.
//
// Caption / action labels span the full width, so we only score 'top' vs
// 'bottom'. Speech bubbles are corner-anchored, so we score all four corners.
const FULL_WIDTH_REGIONS = {
  top: { x0: 0, y0: 0, x1: 1, y1: 0.28 },
  bottom: { x0: 0, y0: 0.72, x1: 1, y1: 1 },
}

const CORNER_REGIONS = {
  'top-left': { x0: 0, y0: 0, x1: 0.55, y1: 0.32 },
  'top-right': { x0: 0.45, y0: 0, x1: 1, y1: 0.32 },
  'bottom-left': { x0: 0, y0: 0.68, x1: 0.55, y1: 1 },
  'bottom-right': { x0: 0.45, y0: 0.68, x1: 1, y1: 1 },
}

// Decode a base64 JPEG into a Float32 busyness map (one float per sample
// pixel). Returns null on any failure — callers should fall back to a default.
async function buildBusynessMap(imageBase64) {
  if (typeof window === 'undefined' || !imageBase64) return null

  const img = await loadImage(`data:image/jpeg;base64,${imageBase64}`)
  if (!img) return null

  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE_W
  canvas.height = SAMPLE_H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, SAMPLE_W, SAMPLE_H)

  let pixels
  try {
    pixels = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H).data
  } catch {
    return null
  }

  // Convert to grayscale once.
  const gray = new Float32Array(SAMPLE_W * SAMPLE_H)
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    gray[i] = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2]
  }

  // Sobel-ish |dx| + |dy| edge magnitude per pixel.
  const edges = new Float32Array(SAMPLE_W * SAMPLE_H)
  for (let y = 1; y < SAMPLE_H - 1; y++) {
    for (let x = 1; x < SAMPLE_W - 1; x++) {
      const i = y * SAMPLE_W + x
      const dx = gray[i + 1] - gray[i - 1]
      const dy = gray[i + SAMPLE_W] - gray[i - SAMPLE_W]
      edges[i] = Math.abs(dx) + Math.abs(dy)
    }
  }

  return edges
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function scoreRegion(edges, region) {
  const x0 = Math.floor(region.x0 * SAMPLE_W)
  const y0 = Math.floor(region.y0 * SAMPLE_H)
  const x1 = Math.ceil(region.x1 * SAMPLE_W)
  const y1 = Math.ceil(region.y1 * SAMPLE_H)
  let sum = 0
  let count = 0
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      sum += edges[y * SAMPLE_W + x]
      count++
    }
  }
  return count > 0 ? sum / count : 0
}

function pickBestRegion(edges, regions) {
  let bestKey = null
  let bestScore = Infinity
  for (const [key, region] of Object.entries(regions)) {
    const score = scoreRegion(edges, region)
    if (score < bestScore) {
      bestScore = score
      bestKey = key
    }
  }
  return bestKey
}

// Public: pick a placement key for a panel.
//   shotType:
//     'narration' | 'action' → returns 'top' | 'bottom'  (full-width strip)
//     'dialogue'             → returns 'top-left' | 'top-right' |
//                              'bottom-left' | 'bottom-right'
//   imageBase64: raw JPEG base64 (no data: prefix).
//
// If detection fails (no image, decode error, SSR), returns a sensible
// default so the UI still renders.
export async function pickPlacement(shotType, imageBase64) {
  const isCorner = shotType === 'dialogue'
  const fallback = isCorner ? 'bottom-right' : 'bottom'

  const edges = await buildBusynessMap(imageBase64)
  if (!edges) return fallback

  const regions = isCorner ? CORNER_REGIONS : FULL_WIDTH_REGIONS
  return pickBestRegion(edges, regions) || fallback
}
