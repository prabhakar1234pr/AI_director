'use client'

const LOADING_MESSAGES = {
  script: 'Director is reading your scene...',
  images: 'Generating storyboard visuals — this takes ~20s per shot...',
  audio: 'Recording narration...',
}

export default function StatusBar({ loading, error, onDismissError }) {
  if (!loading && !error) return null

  if (error) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-red-950 border-b border-red-800 px-4 py-3 text-sm text-red-200">
        <div className="flex items-center gap-2">
          <span className="text-red-400">⚠</span>
          <span>{error}</span>
        </div>
        <button
          onClick={onDismissError}
          className="text-red-400 hover:text-red-200 text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 bg-panel border-b border-border px-4 py-3 text-sm text-slate-300">
      <span className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
      </span>
      <span>{LOADING_MESSAGES[loading] || 'Processing...'}</span>
    </div>
  )
}
