'use client'

import { useSlideshow } from '../hooks/useSlideshow'

export default function SlideshowPlayer({ shotsWithImages, shotsWithAudio }) {
  const { currentIndex, isPlaying, play, pause, next, prev, goTo } =
    useSlideshow(shotsWithAudio)

  const currentShot = shotsWithImages?.[currentIndex]
  const hasAudio = shotsWithAudio && shotsWithAudio.length > 0
  const total = shotsWithImages?.length || 0

  if (!currentShot) return null

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <img
          src={`data:image/jpeg;base64,${currentShot.image_b64}`}
          alt={`Shot ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Shot label overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
            {currentShot.shot}
          </span>
          <span className="bg-black/70 backdrop-blur-sm text-white/70 text-xs px-2 py-1 rounded-lg">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Audio indicator */}
        {hasAudio && isPlaying && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg">
            <span className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '60%' }} />
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '100%', animationDelay: '100ms' }} />
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '40%', animationDelay: '200ms' }} />
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '80%', animationDelay: '50ms' }} />
            </span>
            Playing
          </div>
        )}
      </div>

      {/* Subtitle */}
      <div className="bg-card border border-border rounded-lg px-4 py-2.5 min-h-[2.5rem] flex items-center">
        <p className="text-sm text-slate-300 italic text-center w-full leading-relaxed">
          &ldquo;{currentShot.audio}&rdquo;
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        {/* Prev */}
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-xl border border-border bg-card hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          ◀
        </button>

        {/* Play / Pause */}
        {hasAudio ? (
          <button
            onClick={isPlaying ? pause : play}
            className="flex-1 h-10 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        ) : (
          <div className="flex-1 h-10 rounded-xl border border-border flex items-center justify-center text-xs text-muted">
            Generate audio to enable playback
          </div>
        )}

        {/* Next */}
        <button
          onClick={next}
          disabled={currentIndex === total - 1}
          className="w-10 h-10 rounded-xl border border-border bg-card hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          ▶
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2">
        {shotsWithImages?.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === currentIndex
                ? 'w-4 h-2 bg-accent'
                : 'w-2 h-2 bg-border hover:bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
