'use client'

import { Film, RotateCcw } from 'lucide-react'
import { useDirectorStore } from '../stores/useDirectorStore'

const TYPE_STYLES = {
  narration: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  dialogue: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  action: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
}

export default function ShotCard({ shot, index, isActive }) {
  const imageB64 = useDirectorStore(
    (s) => s.shotsWithImages[index]?.image_b64
  )
  const loadingAll = useDirectorStore((s) => s.loading === 'images')
  const isRegenerating = useDirectorStore((s) =>
    s.regeneratingIndices.includes(index)
  )
  const regenerateImage = useDirectorStore((s) => s.regenerateImage)

  const typeClass = TYPE_STYLES[shot.type] || TYPE_STYLES.narration
  const isLoading = loadingAll || isRegenerating

  return (
    <div
      className={`group rounded-xl border overflow-hidden transition-all bg-card ${
        isActive
          ? 'border-accent ring-2 ring-accent/30'
          : 'border-border hover:border-border-strong'
      }`}
    >
      <div className="relative w-full aspect-video bg-surface overflow-hidden">
        {isLoading && !imageB64 ? (
          <div className="absolute inset-0 skeleton flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-strong">
              <Film className="w-6 h-6 animate-pulse" />
              <span className="text-xs font-medium tracking-wide">
                Rendering shot {index + 1}…
              </span>
            </div>
          </div>
        ) : imageB64 ? (
          <>
            <img
              src={`data:image/jpeg;base64,${imageB64}`}
              alt={`Shot ${index + 1}: ${shot.shot}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            {isRegenerating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2 text-white text-xs font-medium">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Regenerating…
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted">
            <Film className="w-7 h-7 opacity-40" />
            <span className="text-xs">No image yet</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium tracking-wide">
          Shot {index + 1}
        </div>

        {imageB64 && !isRegenerating && (
          <button
            type="button"
            onClick={() => regenerateImage(index, null)}
            aria-label={`Regenerate shot ${index + 1}`}
            className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md hover:bg-black/95 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
          >
            <RotateCcw className="w-3 h-3" />
            Redo
          </button>
        )}
      </div>

      <div className="px-3.5 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white tracking-tight">
            {shot.shot}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border ${typeClass} font-medium uppercase tracking-wider`}
          >
            {shot.type}
          </span>
        </div>
        <p className="text-xs text-muted-strong leading-relaxed line-clamp-2">
          {shot.visual}
        </p>
        {shot.audio && (
          <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-2">
            &ldquo;{shot.audio}&rdquo;
          </p>
        )}
      </div>
    </div>
  )
}
