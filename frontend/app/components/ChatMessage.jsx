'use client'

import { Clapperboard, Image as ImageIcon, User } from 'lucide-react'
import { useDirectorStore } from '../stores/useDirectorStore'

export default function ChatMessage({ role, content, attachedShotIndex }) {
  const isUser = role === 'user'

  const attachedShot = useDirectorStore((s) =>
    typeof attachedShotIndex === 'number' ? s.shots[attachedShotIndex] : null
  )
  const attachedImageB64 = useDirectorStore((s) =>
    typeof attachedShotIndex === 'number'
      ? s.shotsWithImages[attachedShotIndex]?.image_b64
      : null
  )

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
        {typeof attachedShotIndex === 'number' && (
          <div
            className={`mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5 ${
              isUser ? 'bg-white/15' : 'bg-surface/60 border border-border'
            }`}
          >
            {attachedImageB64 ? (
              <img
                src={`data:image/jpeg;base64,${attachedImageB64}`}
                alt={`Shot ${attachedShotIndex + 1} thumbnail`}
                className="w-9 h-9 rounded-md object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-md bg-card/60 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4 opacity-70" />
              </div>
            )}
            <div className="text-[11px] leading-tight">
              <p className={`font-semibold ${isUser ? 'text-white' : 'text-white'}`}>
                Shot {attachedShotIndex + 1}
              </p>
              {attachedShot?.shot && (
                <p
                  className={`truncate max-w-[180px] ${
                    isUser ? 'text-white/80' : 'text-muted-strong'
                  }`}
                >
                  {attachedShot.shot}
                </p>
              )}
            </div>
          </div>
        )}
        {content}
      </div>
    </div>
  )
}
