'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Video as VideoIcon } from 'lucide-react'
import { useDirectorStore } from '../stores/useDirectorStore'

export default function VideoSlideshow() {
  const shotsWithVideos = useDirectorStore((s) => s.shotsWithVideos)
  const shotsWithImages = useDirectorStore((s) => s.shotsWithImages)
  const shots = useDirectorStore((s) => s.shots)
  const loading = useDirectorStore((s) => s.loading)

  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef(null)

  const total = shots.length
  const hasVideos = shotsWithVideos.length > 0
  const currentVideoShot = shotsWithVideos[currentIndex]
  const currentImageShot = shotsWithImages[currentIndex]
  const currentShot = shots[currentIndex]

  // Reset to first shot whenever the video set changes.
  useEffect(() => {
    setCurrentIndex(0)
  }, [shotsWithVideos.length])

  // Auto-advance to the next clip when the current one ends.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onEnded = () => {
      setCurrentIndex((i) => (i + 1 < total ? i + 1 : i))
    }
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
  }, [total, currentVideoShot])

  if (!total) return null

  const next = () => {
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1)
  }
  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const isRendering = loading === 'video'

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/40 border border-border">
        {currentVideoShot?.video_b64 ? (
          <video
            key={currentIndex}
            ref={videoRef}
            src={`data:video/mp4;base64,${currentVideoShot.video_b64}`}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : currentImageShot?.image_b64 ? (
          <img
            src={`data:image/jpeg;base64,${currentImageShot.image_b64}`}
            alt={`Shot ${currentIndex + 1}`}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-strong">
            <VideoIcon className="w-10 h-10 opacity-40" />
          </div>
        )}

        {/* Top labels */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-2 pointer-events-none">
          <span className="bg-black/75 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium tracking-tight">
            {currentShot?.shot}
          </span>
          <span className="bg-black/75 backdrop-blur-sm text-white/80 text-xs px-2 py-1 rounded-lg font-medium tabular-nums">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Rendering overlay (covers all shots) */}
        {isRendering && !currentVideoShot?.video_b64 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm text-white text-sm">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="font-medium">Rendering with Veo 3 Fast</p>
            <p className="text-xs text-white/70 max-w-xs text-center leading-relaxed">
              Each clip takes 1–2 minutes. Sit tight — they&apos;ll all appear together.
            </p>
          </div>
        )}

        {/* Per-shot pending pill (shot has no video yet but rendering done) */}
        {!isRendering && !currentVideoShot?.video_b64 && hasVideos && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white/80 text-sm">
            No video for this shot yet.
          </div>
        )}
      </div>

      {/* Controls */}
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

        <div className="flex-1 h-11 rounded-xl border border-border bg-card/40 flex items-center justify-center gap-2 text-sm text-muted px-4 text-center">
          {hasVideos ? (
            <span className="text-muted-strong truncate">
              {currentShot?.audio || currentShot?.visual || '—'}
            </span>
          ) : isRendering ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating clips…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <VideoIcon className="w-4 h-4" />
              Click <strong className="text-white">Generate Videos</strong> to render this scene with Veo 3
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={next}
          disabled={currentIndex >= total - 1}
          aria-label="Next shot"
          className="w-11 h-11 rounded-xl border border-border bg-card hover:border-border-strong hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-muted-strong hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pt-1" role="tablist" aria-label="Shot selection">
        {shots.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Go to shot ${i + 1}`}
            onClick={() => setCurrentIndex(i)}
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
