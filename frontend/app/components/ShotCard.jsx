'use client'

const TYPE_COLORS = {
  narration: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
  dialogue: 'bg-purple-900/40 text-purple-300 border-purple-800/50',
  action: 'bg-orange-900/40 text-orange-300 border-orange-800/50',
}

export default function ShotCard({ shot, index, imageB64, isActive, onRegenerate, loadingImage }) {
  const typeClass = TYPE_COLORS[shot.type] || TYPE_COLORS.narration

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-all ${
        isActive ? 'border-accent ring-1 ring-accent/30' : 'border-border'
      } bg-card`}
    >
      {/* Image area */}
      <div className="relative w-full aspect-video bg-surface">
        {loadingImage ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : imageB64 ? (
          <img
            src={`data:image/jpeg;base64,${imageB64}`}
            alt={`Shot ${index + 1}: ${shot.shot}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
            <span className="text-3xl opacity-30">🎞</span>
            <span className="text-xs">No image yet</span>
          </div>
        )}

        {/* Shot number badge */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md font-medium">
          Shot {index + 1}
        </div>

        {/* Regenerate button */}
        {imageB64 && onRegenerate && (
          <button
            onClick={() => onRegenerate(index)}
            className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-md hover:bg-black/90 transition-colors"
          >
            ↺ Redo
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">{shot.shot}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded border ${typeClass} font-medium`}>
            {shot.type}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed line-clamp-2">{shot.visual}</p>
        <p className="text-xs text-slate-400 italic leading-relaxed">
          &ldquo;{shot.audio}&rdquo;
        </p>
      </div>
    </div>
  )
}
