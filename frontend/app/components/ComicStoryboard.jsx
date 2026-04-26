'use client'

import { useEffect, useRef, useState } from 'react'
import { Film, RotateCcw } from 'lucide-react'
import { useDirectorStore } from '../stores/useDirectorStore'
import { pickPlacement } from '../utils/smartPlacement'
import { getVariantsFor, pickLayoutCells } from '../utils/storyboardLayouts'

// ── Box anchoring ──────────────────────────────────────────────────────────
//
// `placement` is one of:
//   'top' | 'bottom'                                  (full-width strip)
//   'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'  (corner)
//
// Translated to absolute-position CSS the box sits inside its `<article>`
// panel. When the user drags the box we override these defaults with explicit
// top/left percentages from the store.

function styleFromPlacement(placement, fullWidth) {
  if (fullWidth) {
    return placement === 'top'
      ? { top: '12px', left: '56px', right: '12px' }
      : { bottom: '16px', left: '16px', right: '16px' }
  }
  // Corner placements for speech bubbles.
  switch (placement) {
    case 'top-left':
      return { top: '12px', left: '16px', maxWidth: '70%' }
    case 'top-right':
      return { top: '12px', right: '16px', maxWidth: '70%' }
    case 'bottom-left':
      return { bottom: '16px', left: '16px', maxWidth: '70%' }
    case 'bottom-right':
    default:
      return { bottom: '16px', right: '16px', maxWidth: '70%' }
  }
}

// ── Drag hook ──────────────────────────────────────────────────────────────
// Lets the user drag an overlay box anywhere inside its parent panel. On
// drop we save `{top, left}` (in % of the panel) into the store.

function useDragOverride(panelRef, index, setOverride) {
  const dragState = useRef(null)

  function onPointerDown(e) {
    if (!panelRef.current) return
    // Only left mouse / primary touch.
    if (e.button !== undefined && e.button !== 0) return
    const panelRect = panelRef.current.getBoundingClientRect()
    const boxRect = e.currentTarget.getBoundingClientRect()
    dragState.current = {
      panelRect,
      offsetX: e.clientX - boxRect.left,
      offsetY: e.clientY - boxRect.top,
      boxW: boxRect.width,
      boxH: boxRect.height,
    }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e) {
    const s = dragState.current
    if (!s) return
    const { panelRect, offsetX, offsetY, boxW, boxH } = s
    let left = e.clientX - panelRect.left - offsetX
    let top = e.clientY - panelRect.top - offsetY
    // Clamp inside the panel.
    left = Math.max(0, Math.min(panelRect.width - boxW, left))
    top = Math.max(0, Math.min(panelRect.height - boxH, top))
    const leftPct = (left / panelRect.width) * 100
    const topPct = (top / panelRect.height) * 100
    setOverride(index, { top: topPct, left: leftPct })
  }

  function onPointerUp(e) {
    if (!dragState.current) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    dragState.current = null
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}

// ── Overlay boxes ──────────────────────────────────────────────────────────

function OverlayBox({
  children,
  variant,
  placement,
  override,
  panelRef,
  index,
  setOverride,
}) {
  const fullWidth = variant === 'caption' || variant === 'action'
  const baseStyle = override
    ? overrideStyle(override, variant)
    : styleFromPlacement(placement, fullWidth)

  const drag = useDragOverride(panelRef, index, setOverride)

  const className = {
    caption:
      'absolute bg-[#fff5cc] border-[2.5px] border-black px-3 py-1.5 text-[#1a1a1a] text-sm font-bold leading-snug shadow-[3px_3px_0_0_rgba(0,0,0,0.85)] uppercase tracking-wide cursor-grab active:cursor-grabbing select-none touch-none',
    speech:
      'absolute bg-white border-[2.5px] border-black rounded-3xl px-4 py-2.5 text-sm font-medium leading-snug text-[#1a1a1a] shadow-[3px_3px_0_0_rgba(0,0,0,0.85)] cursor-grab active:cursor-grabbing select-none touch-none',
    action:
      'absolute bg-black text-yellow-300 px-3 py-1.5 border-[2.5px] border-black text-sm italic font-bold leading-snug shadow-[3px_3px_0_0_rgba(0,0,0,0.85)] cursor-grab active:cursor-grabbing select-none touch-none',
  }[variant]

  return (
    <div
      className={className}
      style={baseStyle}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerUp}
      title="Drag to reposition"
    >
      {children}
    </div>
  )
}

function overrideStyle(override, variant) {
  // For full-width strips we keep the horizontal anchors so the strip stays
  // panel-wide, and only honour the dragged `top`. For speech bubbles the
  // user can place them anywhere.
  if (variant === 'caption') {
    return { top: `${override.top}%`, left: '56px', right: '12px' }
  }
  if (variant === 'action') {
    return { top: `${override.top}%`, left: '16px', right: '16px' }
  }
  return {
    top: `${override.top}%`,
    left: `${override.left}%`,
    maxWidth: '70%',
  }
}

// ── Panel ──────────────────────────────────────────────────────────────────

function Panel({ shot, image, index }) {
  const panelRef = useRef(null)
  const [placement, setPlacement] = useState(null)

  const override = useDirectorStore((s) => s.storyboardOverrides[index])
  const setOverride = useDirectorStore((s) => s.setStoryboardOverride)
  const clearOverride = useDirectorStore((s) => s.clearStoryboardOverride)

  const hasAudio = !!shot.audio
  const isDialogue = shot.type === 'dialogue'
  const isNarration = shot.type === 'narration'
  const isAction = shot.type === 'action'

  // Run saliency analysis when the image or shot type changes. The result
  // is a placement key like 'top' / 'bottom-right'.
  useEffect(() => {
    let cancelled = false
    if (!image || !hasAudio) {
      setPlacement(null)
      return
    }
    pickPlacement(shot.type, image).then((p) => {
      if (!cancelled) setPlacement(p)
    })
    return () => {
      cancelled = true
    }
  }, [image, shot.type, hasAudio])

  const variant = isDialogue ? 'speech' : isNarration ? 'caption' : 'action'
  const effectivePlacement =
    placement ?? (isDialogue ? 'bottom-right' : 'bottom')

  return (
    <article
      ref={panelRef}
      className="relative w-full h-full bg-[#0e0e10] border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.9)] overflow-hidden group"
      style={{ minHeight: '180px' }}
    >
      {image ? (
        <img
          src={`data:image/jpeg;base64,${image}`}
          alt={`Panel ${index + 1}: ${shot.shot}`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#888] bg-[#1a1a1a]">
          <Film className="w-8 h-8 opacity-50" />
          <p className="text-xs uppercase tracking-wider">
            No image — generate visuals first
          </p>
        </div>
      )}

      {/* Panel number stamp (top-left) */}
      <div className="absolute top-3 left-3 z-20 w-9 h-9 bg-yellow-400 border-[2.5px] border-black rounded-full flex items-center justify-center font-black text-black text-sm shadow-[2px_2px_0_0_rgba(0,0,0,0.85)] pointer-events-none">
        {index + 1}
      </div>

      {/* Reset-placement button: only visible when the user has dragged this
          panel's box. Clicking restores AI-picked placement. */}
      {override && (
        <button
          type="button"
          onClick={() => clearOverride(index)}
          className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-sm hover:bg-black"
          title="Reset to auto placement"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      )}

      {hasAudio && isNarration && (
        <OverlayBox
          variant="caption"
          placement={effectivePlacement}
          override={override}
          panelRef={panelRef}
          index={index}
          setOverride={setOverride}
        >
          {shot.audio}
        </OverlayBox>
      )}

      {hasAudio && isDialogue && (
        <OverlayBox
          variant="speech"
          placement={effectivePlacement}
          override={override}
          panelRef={panelRef}
          index={index}
          setOverride={setOverride}
        >
          &ldquo;{shot.audio}&rdquo;
        </OverlayBox>
      )}

      {hasAudio && isAction && (
        <OverlayBox
          variant="action"
          placement={effectivePlacement}
          override={override}
          panelRef={panelRef}
          index={index}
          setOverride={setOverride}
        >
          {shot.audio}
        </OverlayBox>
      )}
    </article>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function ComicStoryboard({ shots, shotsWithImages }) {
  const variantIndex = useDirectorStore(
    (s) => s.storyboardLayoutVariants[shots?.length] ?? 0
  )
  const setVariant = useDirectorStore((s) => s.setStoryboardLayoutVariant)

  if (!shots?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted text-sm gap-3 py-20">
        <Film className="w-8 h-8 opacity-40" />
        <p>No shots yet.</p>
      </div>
    )
  }

  const imageMap = Object.fromEntries(
    shotsWithImages.map((s, i) => [i, s?.image_b64])
  )

  const variants = getVariantsFor(shots.length)
  const cells = pickLayoutCells(shots.length, variantIndex)

  return (
    <div
      className="min-h-full py-8 px-4 sm:px-8 lg:px-12 bg-[#f4eedc]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.18) 1px, transparent 0)',
        backgroundSize: '8px 8px',
      }}
    >
      <div className="max-w-5xl mx-auto bg-white border-[5px] border-black p-4 sm:p-6 shadow-[10px_10px_0_0_rgba(0,0,0,0.9)]">
        <header className="flex items-center justify-between gap-3 mb-4 pb-3 border-b-[3px] border-black">
          <h2
            className="text-3xl sm:text-4xl text-black tracking-wider"
            style={{ fontFamily: 'var(--font-bangers), "Impact", sans-serif' }}
          >
            Storyboard
          </h2>
          <div className="flex items-center gap-3">
            {variants.length > 1 && (
              <label className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-black">
                <span className="hidden sm:inline">Layout</span>
                <select
                  value={variantIndex}
                  onChange={(e) => setVariant(shots.length, Number(e.target.value))}
                  className="bg-white border-[2.5px] border-black px-2 py-1 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  {variants.map((v, i) => (
                    <option key={i} value={i}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span className="text-xs uppercase tracking-widest font-bold text-black">
              {shots.length} panels
            </span>
          </div>
        </header>

        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gridAutoRows: 'minmax(200px, auto)',
          }}
        >
          {shots.map((shot, i) => {
            const cell = cells[i] ?? { c: 3, r: 1 }
            return (
              <div
                key={i}
                style={{
                  gridColumn: `span ${cell.c} / span ${cell.c}`,
                  gridRow: `span ${cell.r} / span ${cell.r}`,
                }}
              >
                <Panel shot={shot} image={imageMap[i]} index={i} />
              </div>
            )
          })}
        </div>

        <footer className="mt-5 pt-3 border-t-[3px] border-black flex items-center justify-between text-xs font-bold uppercase tracking-widest text-black">
          <span>AI Director</span>
          <span>Drag any text box to reposition</span>
        </footer>
      </div>
    </div>
  )
}
