'use client'

import { Clapperboard, User } from 'lucide-react'

export default function ChatMessage({ role, content }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        aria-hidden
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
          isUser
            ? 'bg-accent text-white shadow-sm shadow-accent/30'
            : 'bg-card border border-border text-muted-strong'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Clapperboard className="w-4 h-4" />}
      </div>

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-accent text-white rounded-tr-md'
            : 'bg-card border border-border text-slate-100 rounded-tl-md'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
