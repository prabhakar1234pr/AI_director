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
    <div className="absolute top-5 left-5 z-30 flex items-center gap-2 animate-fade-in">
      <div className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-2xl bg-panel/80 backdrop-blur border border-border-strong shadow-xl shadow-black/30">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center shadow-md shadow-accent/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight pr-1">
          <p className="text-sm font-bold text-white tracking-tight">
            AI Director
          </p>
          <p className="text-[10px] text-muted -mt-0.5 uppercase tracking-widest font-medium">
            Playground
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleReset}
        title="Start a new scene"
        className="h-10 px-3 rounded-2xl bg-panel/80 backdrop-blur border border-border-strong shadow-xl shadow-black/30 text-sm text-muted-strong hover:text-white hover:border-accent/60 transition-colors flex items-center gap-2 font-medium"
      >
        <RefreshCw className="w-4 h-4" />
        New scene
      </button>
    </div>
  )
}
