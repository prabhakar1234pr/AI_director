'use client'

import { AlertCircle, Loader2, X } from 'lucide-react'

const LOADING_MESSAGES = {
  script: 'Director is reading your scene…',
  images: 'Generating storyboard visuals — about 20s per shot…',
  audio: 'Recording narration…',
}

export default function StatusBar({ loading, error, onDismissError }) {
  if (!loading && !error) return null

  if (error) {
    return (
      <div
        role="alert"
        className="fixed bottom-6 right-6 z-50 max-w-md flex items-start gap-3 bg-red-950/95 backdrop-blur border border-red-800/80 shadow-2xl shadow-red-950/40 rounded-xl px-4 py-3 text-sm text-red-100 animate-slide-down"
      >
        <AlertCircle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
        <div className="flex-1 leading-relaxed">{error}</div>
        <button
          onClick={onDismissError}
          aria-label="Dismiss error"
          className="text-red-300 hover:text-red-100 -mr-1 -mt-1 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-panel/95 backdrop-blur border border-border-strong shadow-2xl shadow-black/40 rounded-xl px-4 py-3 text-sm text-muted-strong animate-slide-down"
    >
      <Loader2 className="w-4 h-4 text-accent animate-spin flex-shrink-0" />
      <span>{LOADING_MESSAGES[loading] || 'Processing…'}</span>
    </div>
  )
}
