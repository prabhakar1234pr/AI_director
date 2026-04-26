'use client'

import { Film } from 'lucide-react'

// Variable panel layouts give the page a real comic-book rhythm.
// We pick a layout based on shot count (1-6 supported, then we reuse).
// Each entry is a list of grid `colSpan` values for the 6-col grid.
const LAYOUTS = {
  1: [6],
  2: [3, 3],
  3: [6, 3, 3],
  4: [4, 2, 2, 4],
  5: [6, 3, 3, 3, 3],
  6: [4, 2, 3, 3, 6, 6],
}

function pickLayout(n) {
  if (LAYOUTS[n]) return LAYOUTS[n]
  // Fallback: full-width hero, then 2-col rows
  const layout = [6]
  for (let i = 1; i < n; i += 2) {
    layout.push(3)
    if (i + 1 < n) layout.push(3)
  }
  return layout
}

function CaptionBox({ children }) {
  return (
    <div className="absolute top-3 left-3 right-3 bg-[#fff5cc] border-[2.5px] border-black px-3 py-1.5 text-[#1a1a1a] text-sm font-bold leading-snug shadow-[3px_3px_0_0_rgba(0,0,0,0.85)] uppercase tracking-wide">
      {children}
    </div>
  )
}

function SpeechBubble({ children, side = 'right' }) {
  // side: 'left' or 'right' — controls the tail position
  const positionClass = side === 'right' ? 'right-4 ml-12' : 'left-4 mr-12'
  const tailClass =
    side === 'right'
      ? "after:right-6 after:border-l-transparent after:border-r-black after:border-t-black"
      : "after:left-6 after:border-r-transparent after:border-l-black after:border-t-black"

  return (
    <div
      className={`absolute bottom-4 ${positionClass} max-w-[70%] bg-white border-[2.5px] border-black rounded-3xl px-4 py-2.5 text-sm font-medium leading-snug text-[#1a1a1a] shadow-[3px_3px_0_0_rgba(0,0,0,0.85)] after:content-[''] after:absolute after:-bottom-3 after:w-0 after:h-0 after:border-[10px] after:border-b-transparent ${tailClass}`}
    >
      {children}
    </div>
  )
}

function ActionLabel({ children }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-black text-yellow-300 px-3 py-1.5 border-[2.5px] border-black text-sm italic font-bold leading-snug shadow-[3px_3px_0_0_rgba(0,0,0,0.85)]">
      {children}
    </div>
  )
}

function Panel({ shot, image, index }) {
  const hasAudio = !!shot.audio
  const isDialogue = shot.type === 'dialogue'
  const isNarration = shot.type === 'narration'
  const isAction = shot.type === 'action'
  const bubbleSide = index % 2 === 0 ? 'right' : 'left'

  return (
    <article
      className="relative w-full h-full bg-[#0e0e10] border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.9)] overflow-hidden group"
      style={{ minHeight: '180px' }}
    >
      {/* Image or placeholder */}
      {image ? (
        <img
          src={`data:image/jpeg;base64,${image}`}
          alt={`Panel ${index + 1}: ${shot.shot}`}
          className="absolute inset-0 w-full h-full object-cover"
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
      <div className="absolute top-3 left-3 z-20 w-9 h-9 bg-yellow-400 border-[2.5px] border-black rounded-full flex items-center justify-center font-black text-black text-sm shadow-[2px_2px_0_0_rgba(0,0,0,0.85)]">
        {index + 1}
      </div>

      {/* Narration → caption box at top */}
      {hasAudio && isNarration && (
        <CaptionBox>{shot.audio}</CaptionBox>
      )}

      {/* Dialogue → speech bubble */}
      {hasAudio && isDialogue && (
        <SpeechBubble side={bubbleSide}>
          &ldquo;{shot.audio}&rdquo;
        </SpeechBubble>
      )}

      {/* Action with audio cue → action label */}
      {hasAudio && isAction && <ActionLabel>{shot.audio}</ActionLabel>}
    </article>
  )
}

export default function ComicStoryboard({ shots, shotsWithImages }) {
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

  const layout = pickLayout(shots.length)

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
        <header className="flex items-center justify-between mb-4 pb-3 border-b-[3px] border-black">
          <h2
            className="text-3xl sm:text-4xl text-black tracking-wider"
            style={{ fontFamily: 'var(--font-bangers), "Impact", sans-serif' }}
          >
            Storyboard
          </h2>
          <span className="text-xs uppercase tracking-widest font-bold text-black">
            {shots.length} panels
          </span>
        </header>

        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gridAutoRows: 'minmax(200px, auto)',
          }}
        >
          {shots.map((shot, i) => {
            const span = layout[i] ?? 3
            const rowSpan = span >= 4 ? 2 : 1
            return (
              <div
                key={i}
                style={{
                  gridColumn: `span ${span} / span ${span}`,
                  gridRow: `span ${rowSpan} / span ${rowSpan}`,
                }}
              >
                <Panel shot={shot} image={imageMap[i]} index={i} />
              </div>
            )
          })}
        </div>

        <footer className="mt-5 pt-3 border-t-[3px] border-black flex items-center justify-between text-xs font-bold uppercase tracking-widest text-black">
          <span>AI Director</span>
          <span>Issue #1</span>
        </footer>
      </div>
    </div>
  )
}
