'use client'

import { ChevronLeft, ChevronRight, Pause, Play, Volume2 } from 'lucide-react'
import { useSlideshow } from '../hooks/useSlideshow'

export default function SlideshowPlayer({ shotsWithImages, shotsWithAudio }) {
  const { currentIndex, isPlaying, play, pause, next, prev, goTo } =
    useSlideshow(shotsWithAudio)

  const currentShot = shotsWithImages?.[currentIndex]
  const hasAudio = shotsWithAudio && shotsWithAudio.length > 0
  const total = shotsWithImages?.length || 0

  if (!currentShot) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/40 border border-border">
        <img
          src={`data:image/jpeg;base64,${currentShot.image_b64}`}
          alt={`Shot ${currentIndex + 1}: ${currentShot.shot}`}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
          <span className="bg-black/75 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium tracking-tight">
            {currentShot.shot}
          </span>
          <span className="bg-black/75 backdrop-blur-sm text-white/80 text-xs px-2 py-1 rounded-lg font-medium tabular-nums">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {hasAudio && isPlaying && (
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2 bg-accent/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium animate-fade-in">
            <span className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '60%' }} />
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '100%', animationDelay: '100ms' }} />
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '40%', animationDelay: '200ms' }} />
              <span className="w-0.5 bg-white rounded-sm animate-pulse" style={{ height: '80%', animationDelay: '50ms' }} />
            </span>
            Playing
          </div>
        )}

        {currentShot.audio && (
          <div className="absolute inset-x-6 bottom-5 flex justify-center pointer-events-none">
            <p className="text-center text-white text-base leading-relaxed font-medium drop-shadow-lg max-w-2xl text-balance">
              {currentShot.audio}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={prev}
          disabled={currentIndex === 0}
          aria-label="Previous shot"
          className="w-11 h-11 rounded-xl border border-border bg-card hover:border-border-strong hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-muted-strong hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {hasAudio ? (
          <button
            type="button"
            onClick={isPlaying ? pause : play}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex-1 h-11 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-accent/20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Play with narration
              </>
            )}
          </button>
        ) : (
          <div className="flex-1 h-11 rounded-xl border border-border bg-card/40 flex items-center justify-center gap-2 text-sm text-muted">
            <Volume2 className="w-4 h-4" />
            Generate audio to enable playback
          </div>
        )}

        <button
          type="button"
          onClick={next}
          disabled={currentIndex === total - 1}
          aria-label="Next shot"
          className="w-11 h-11 rounded-xl border border-border bg-card hover:border-border-strong hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-muted-strong hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center gap-2 pt-1" role="tablist" aria-label="Shot selection">
        {shotsWithImages?.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Go to shot ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === currentIndex
                ? 'w-6 h-2 bg-accent'
                : 'w-2 h-2 bg-border hover:bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
