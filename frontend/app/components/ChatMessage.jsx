'use client'

export default function ChatMessage({ role, content }) {
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
          isUser
            ? 'bg-accent text-white'
            : 'bg-card border border-border text-slate-400'
        }`}
      >
        {isUser ? 'U' : '🎬'}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-card border border-border text-slate-200 rounded-tl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}
