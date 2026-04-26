'use client'

import { useEffect, useRef, useState } from 'react'
import { Clapperboard, Send, Sparkles } from 'lucide-react'
import ChatMessage from './ChatMessage'

const EXAMPLE_PROMPTS = [
  'A detective in a rain-soaked alley at midnight',
  'An astronaut finds a monolith on Mars at dawn',
  'Two strangers meet in a Tokyo train station',
]

export default function ChatPanel({ messages, loading, onSend, compact = false }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend(text) {
    const value = (typeof text === 'string' ? text : input).trim()
    if (!value || loading) return
    setInput('')
    onSend(value)
  }

  const isDisabled = loading === 'script'

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="flex-shrink-0 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold tracking-tight text-white">Scene Chat</h2>
        </div>
        {!compact && (
          <p className="text-xs text-muted mt-1">
            Describe what you want to see. The director will reply with shots.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pb-8">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
              <Clapperboard className="w-6 h-6 text-accent" />
            </div>
            <div className="space-y-2 max-w-xs">
              <p className="text-base text-white font-medium tracking-tight">
                Pitch your scene
              </p>
              <p className="text-sm text-muted-strong leading-relaxed">
                One sentence is enough. The director will ask follow-ups if it needs more.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-2 mt-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={isDisabled}
                  className="w-full text-left text-sm text-muted-strong bg-card/60 border border-border rounded-lg px-3 py-2 hover:border-accent/60 hover:text-white hover:bg-card transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {loading === 'script' && (
          <div className="flex gap-3 flex-row animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center mt-0.5">
              <Clapperboard className="w-4 h-4 text-muted-strong" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 bg-muted-strong rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-strong rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted-strong rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 px-5 py-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder="Describe your scene…"
            rows={2}
            className="flex-1 resize-none bg-card border border-border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isDisabled || !input.trim()}
            aria-label="Send message"
            className="flex-shrink-0 w-10 h-10 bg-accent hover:bg-accent-hover disabled:bg-card disabled:text-muted disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-colors shadow-sm shadow-accent/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">Enter</kbd> send ·{' '}
          <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono">Shift+Enter</kbd> new line
        </p>
      </div>
    </div>
  )
}
