'use client'

import { useEffect, useRef, useState } from 'react'
import { Palette, X } from 'lucide-react'
import { useDirectorStore } from '../../stores/useDirectorStore'

const STYLE_PRESETS = [
  'cinematic',
  'noir',
  'anime',
  'wes anderson',
  'studio ghibli',
  'cyberpunk',
  'vintage film',
]

export default function StyleWidget() {
  const style = useDirectorStore((s) => s.style)
  const setStyle = useDirectorStore((s) => s.setStyle)

  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div
      ref={containerRef}
      className="absolute top-5 right-5 z-30 animate-fade-in"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-10 px-3.5 rounded-2xl backdrop-blur border shadow-xl shadow-black/30 text-sm transition-colors flex items-center gap-2 font-medium max-w-[240px] ${
          style
            ? 'bg-accent/15 border-accent/40 text-white hover:bg-accent/20'
            : 'bg-panel/80 border-border-strong text-muted-strong hover:text-white hover:border-accent/60'
        }`}
      >
        <Palette className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{style || 'Visual style'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-panel/95 backdrop-blur border border-border-strong rounded-2xl shadow-2xl shadow-black/40 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted uppercase tracking-widest font-medium">
              Visual style
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-muted hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g. noir, anime, cinematic"
            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
            autoFocus
          />

          <p className="text-xs text-muted mt-3 mb-2 font-medium">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {STYLE_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setStyle(preset)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  style === preset
                    ? 'bg-accent/20 border-accent/40 text-white'
                    : 'bg-card border-border text-muted-strong hover:border-border-strong hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
            {style && (
              <button
                type="button"
                onClick={() => setStyle('')}
                className="text-xs px-2.5 py-1 rounded-md text-muted hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
