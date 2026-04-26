'use client'

import { Clapperboard, RefreshCw } from 'lucide-react'
import { useDirectorStore } from '../../stores/useDirectorStore'

export default function BrandWidget() {
  const messagesLen = useDirectorStore((s) => s.messages.length)
  const reset = useDirectorStore((s) => s.reset)

  function handleReset() {
    if (
      messagesLen > 0 &&
      !window.confirm('Start a new scene? Your current work will be lost.')
    ) {
      return
    }
    reset()
  }

  return (
    <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 animate-fade-in">
      <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-panel/80 backdrop-blur border border-border-strong shadow-lg shadow-black/30">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center shadow-sm shadow-accent/30">
          <Clapperboard className="w-3 h-3 text-white" />
        </div>
        <p className="text-xs font-bold text-white tracking-tight">
          AI Director
        </p>
      </div>

      <button
        type="button"
        onClick={handleReset}
        title="Start a new scene"
        className="h-8 px-2.5 rounded-xl bg-panel/80 backdrop-blur border border-border-strong shadow-lg shadow-black/30 text-xs text-muted-strong hover:text-white hover:border-accent/60 transition-colors flex items-center gap-1.5 font-medium"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        New scene
      </button>
    </div>
  )
}
