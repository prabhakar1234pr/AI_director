'use client'

import { useEffect, useRef, useState } from 'react'
import ChatMessage from './ChatMessage'

export default function ChatPanel({ messages, loading, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    onSend(trimmed)
  }

  const isDisabled = loading === 'script'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <p className="text-xs text-muted uppercase tracking-widest font-medium">Scene Chat</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-8">
            <div className="text-4xl">🎬</div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[220px]">
              Describe a scene and I&apos;ll turn it into a cinematic storyboard.
            </p>
            <div className="text-xs text-muted space-y-1 mt-2">
              <p className="italic">&ldquo;A detective in a rain-soaked alley at midnight&rdquo;</p>
              <p className="italic">&ldquo;An astronaut finds a monolith on Mars at dawn&rdquo;</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Typing indicator */}
        {loading === 'script' && (
          <div className="flex gap-3 flex-row">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-xs mt-0.5">
              🎬
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder="Describe your scene..."
            rows={2}
            className="flex-1 resize-none bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-muted focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={isDisabled || !input.trim()}
            className="flex-shrink-0 w-9 h-9 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-colors"
          >
            ↑
          </button>
        </div>
        <p className="text-xs text-muted mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
