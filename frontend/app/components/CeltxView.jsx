'use client'

// Industry-standard screenplay layout — modeled on Celtx / Final Draft.
// Courier 12pt, 1.5" left margin, 1" right.
// Element indents (from the 1.5" left margin baseline):
//   Scene heading : 0
//   Action        : 0   (full body width)
//   Character     : 2.0in (CAPS)
//   Parenthetical : 1.6in
//   Dialogue      : 1.0in   (max width ~3.3in)
//   Transition    : right-aligned, CAPS

const SPEAKER_FOR_TYPE = {
  dialogue: 'CHARACTER',
  narration: 'NARRATOR (V.O.)',
  action: null,
}

function formatSlugLine(shotLabel) {
  // shot label like "Wide shot" → "WIDE SHOT"
  // We treat each shot as its own slugline. The user's chat can edit `shot`
  // to e.g. "Wide shot — INT. ALLEY - NIGHT" if they want a real INT./EXT.
  return (shotLabel || '').toUpperCase().trim()
}

export default function CeltxView({ shots }) {
  if (!shots?.length) return null

  return (
    <div className="min-h-full py-4 px-6 flex justify-center">
      <article
        className="bg-[#fdfcf7] text-[#1a1a1a] shadow-2xl shadow-black/40 w-full max-w-[8.5in] min-h-[11in] py-[1in] pl-[1.5in] pr-[1in]"
        style={{
          fontFamily: 'var(--font-jetbrains), "Courier New", Courier, monospace',
          fontSize: '12pt',
          lineHeight: '1',
        }}
      >
        <header className="mb-12 text-center">
          <p className="uppercase tracking-[0.18em] text-[10pt] text-[#666]">
            Storyboard Screenplay
          </p>
          <p className="text-[10pt] text-[#888] mt-1">
            {shots.length} shot{shots.length !== 1 ? 's' : ''}
          </p>
        </header>

        <p className="mb-6 uppercase">FADE IN:</p>

        {shots.map((shot, i) => {
          const slug = formatSlugLine(shot.shot)
          const speaker = SPEAKER_FOR_TYPE[shot.type]

          return (
            <section key={i} className="mb-8">
              <p className="uppercase font-bold mb-3">
                {`SHOT ${i + 1} — ${slug || 'UNTITLED'}`}
              </p>

              {shot.visual && (
                <p className="mb-4 whitespace-pre-wrap leading-[1.4]">
                  {shot.visual}
                </p>
              )}

              {shot.audio && shot.type === 'action' && (
                <p className="mb-4 whitespace-pre-wrap leading-[1.4] italic">
                  {shot.audio}
                </p>
              )}

              {shot.audio && shot.type !== 'action' && (
                <div className="mb-4">
                  <p
                    className="uppercase font-bold"
                    style={{ marginLeft: '2.0in' }}
                  >
                    {speaker || 'NARRATOR (V.O.)'}
                  </p>
                  <p
                    className="leading-[1.2] whitespace-pre-wrap"
                    style={{ marginLeft: '1.0in', maxWidth: '3.3in' }}
                  >
                    {shot.audio}
                  </p>
                </div>
              )}

              {i < shots.length - 1 && (
                <p className="text-right uppercase mt-6">CUT TO:</p>
              )}
            </section>
          )
        })}

        <p className="text-right uppercase mt-10">FADE OUT.</p>

        <footer className="mt-16 pt-4 border-t border-[#ddd] flex items-center justify-between text-[9pt] text-[#888]">
          <span>AI Director</span>
          <span>Page 1</span>
        </footer>
      </article>
    </div>
  )
}
