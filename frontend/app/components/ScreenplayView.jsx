'use client'

const SPEAKER = {
  narration: 'NARRATOR (V.O.)',
  dialogue: 'CHARACTER',
  action: null,
}

export default function ScreenplayView({ shots }) {
  if (!shots?.length) return null

  return (
    <article className="rounded-2xl border border-border overflow-hidden bg-[#0c0e16]">
      <header className="px-8 py-3.5 border-b border-border bg-card/30 flex items-center justify-between">
        <span className="text-xs text-muted uppercase tracking-[0.2em] font-medium">
          Scene Script
        </span>
        <span className="text-xs text-muted">
          {shots.length} shot{shots.length !== 1 ? 's' : ''}
        </span>
      </header>

      <div className="px-8 py-8 font-mono text-[13px] leading-relaxed">
        <p className="text-muted text-xs mb-8 tracking-wider">FADE IN:</p>

        {shots.map((shot, i) => (
          <section key={i} className="mb-10">
            <div className="border-b border-border/40 pb-2 mb-4">
              <p className="text-white font-bold tracking-[0.15em] text-[13px]">
                SHOT {i + 1} — {shot.shot?.toUpperCase()}
              </p>
              <p className="text-[10px] text-muted uppercase tracking-[0.2em] mt-1">
                {shot.type === 'action'
                  ? 'Action'
                  : shot.type === 'dialogue'
                  ? 'Dialogue'
                  : 'Narration'}
              </p>
            </div>

            <p className="text-slate-200 leading-relaxed">
              {shot.visual}
            </p>

            {shot.audio && (
              <div className="mt-5 pl-12 pr-12">
                <p className="text-muted text-[11px] tracking-[0.2em] uppercase mb-1.5">
                  {SPEAKER[shot.type] ?? 'NARRATOR (V.O.)'}
                </p>
                <p className="text-white leading-relaxed">
                  &ldquo;{shot.audio}&rdquo;
                </p>
              </div>
            )}

            {i < shots.length - 1 && (
              <p className="text-muted text-[11px] text-right tracking-[0.2em] mt-6">
                CUT TO:
              </p>
            )}
          </section>
        ))}

        <p className="text-muted text-xs text-right pt-2 tracking-[0.2em]">FADE OUT.</p>
      </div>
    </article>
  )
}
