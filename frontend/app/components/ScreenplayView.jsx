'use client'

const SPEAKER = {
  narration: 'NARRATOR (V.O.)',
  dialogue: 'CHARACTER',
  action: null,
}

export default function ScreenplayView({ shots }) {
  if (!shots?.length) return null

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-[#0c0d12]">
      {/* Header */}
      <div className="px-8 py-3 border-b border-border bg-card/40 flex items-center justify-between">
        <span className="text-[10px] text-muted uppercase tracking-widest font-medium">Scene Script</span>
        <span className="text-[10px] text-muted">{shots.length} shot{shots.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Screenplay body */}
      <div className="px-8 py-6 font-mono text-sm space-y-1">
        <p className="text-muted text-xs mb-6">FADE IN:</p>

        {shots.map((shot, i) => (
          <div key={i} className="space-y-3 mb-8">
            {/* Scene heading */}
            <div className="border-b border-border/40 pb-1.5">
              <p className="text-white font-bold tracking-wider text-xs">
                SHOT {i + 1} — {shot.shot?.toUpperCase()}
              </p>
            </div>

            {/* Type tag */}
            <p className="text-[10px] text-muted uppercase tracking-widest">
              {shot.type === 'action' ? 'ACTION' : shot.type === 'dialogue' ? 'DIALOGUE' : 'NARRATION'}
            </p>

            {/* Visual / action description */}
            <p className="text-slate-300 leading-relaxed text-xs pl-4 border-l border-border/50">
              {shot.visual}
            </p>

            {/* Audio as dialogue/V.O. */}
            {shot.audio && (
              <div className="pl-16 space-y-1 pt-1">
                <p className="text-slate-500 text-[10px] tracking-widest uppercase">
                  {SPEAKER[shot.type] ?? 'NARRATOR (V.O.)'}
                </p>
                <p className="text-slate-200 italic leading-relaxed text-xs pl-4">
                  &ldquo;{shot.audio}&rdquo;
                </p>
              </div>
            )}

            {/* Cut transition */}
            {i < shots.length - 1 && (
              <p className="text-muted text-[10px] text-right pr-2 pt-1">CUT TO:</p>
            )}
          </div>
        ))}

        <p className="text-muted text-xs text-right pt-2">FADE OUT.</p>
      </div>
    </div>
  )
}
