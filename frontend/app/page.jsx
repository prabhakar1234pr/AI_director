'use client'

import { useState } from 'react'
import { Clapperboard, MessageSquare, Palette, RefreshCw, X } from 'lucide-react'
import ChatPanel from './components/ChatPanel'
import ScriptPanel from './components/ScriptPanel'
import StatusBar from './components/StatusBar'
import { useDirectorStore } from './stores/useDirectorStore'

const STYLE_PRESETS = [
  'cinematic',
  'noir',
  'anime',
  'wes anderson',
  'studio ghibli',
  'cyberpunk',
  'vintage film',
]

export default function Home() {
  const step = useDirectorStore((s) => s.step)
  const style = useDirectorStore((s) => s.style)
  const setStyle = useDirectorStore((s) => s.setStyle)
  const messagesLen = useDirectorStore((s) => s.messages.length)
  const reset = useDirectorStore((s) => s.reset)

  const [styleMenuOpen, setStyleMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)

  const handleReset = () => {
    if (
      messagesLen > 0 &&
      !window.confirm('Start a new scene? Your current work will be lost.')
    ) {
      return
    }
    reset()
  }

  const isScriptPage = step === 1
  const showChat = isScriptPage || chatOpen

  return (
    <>
      <StatusBar />

      <div className="flex flex-col h-screen bg-surface text-white">
        <header className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-3.5 border-b border-border bg-panel">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-strong flex items-center justify-center shadow-md shadow-accent/30">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                AI Director
              </h1>
              <p className="text-xs text-muted leading-tight">
                Scene → Storyboard → Narration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setStyleMenuOpen((v) => !v)}
                onBlur={() => setTimeout(() => setStyleMenuOpen(false), 150)}
                className="h-9 px-3 rounded-lg bg-card border border-border hover:border-border-strong text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-2 max-w-[220px]"
              >
                <Palette className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{style || 'Style'}</span>
              </button>
              {styleMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-panel border border-border-strong rounded-xl shadow-2xl shadow-black/40 p-3 z-30 animate-fade-in">
                  <p className="text-xs text-muted uppercase tracking-widest font-medium mb-2 px-1">
                    Visual style
                  </p>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g. noir, anime, cinematic"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted focus:outline-none focus:border-accent"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setStyle(preset)
                        }}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
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
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setStyle('')
                        }}
                        className="text-xs px-2 py-1 rounded-md text-muted hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isScriptPage && (
              <button
                type="button"
                onClick={() => setChatOpen((v) => !v)}
                aria-pressed={chatOpen}
                className={`h-9 px-3 rounded-lg border text-sm transition-colors flex items-center gap-2 font-medium ${
                  chatOpen
                    ? 'bg-accent/15 border-accent/40 text-white'
                    : 'bg-card border-border hover:border-border-strong text-muted-strong hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="h-9 px-3 rounded-lg border border-border hover:border-border-strong bg-card text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-2 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              New scene
            </button>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          {showChat && (
            <aside
              className={`border-r border-border flex-shrink-0 ${
                isScriptPage ? 'w-[38%] min-w-[360px]' : 'w-[28%] min-w-[320px]'
              }`}
            >
              <ChatPanel compact={!isScriptPage} />
            </aside>
          )}

          <section className="flex-1 min-w-0">
            <ScriptPanel />
          </section>
        </main>
      </div>
    </>
  )
}
