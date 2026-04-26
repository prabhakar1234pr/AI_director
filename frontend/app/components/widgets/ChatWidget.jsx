'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import ChatPanel from '../ChatPanel'
import { useDirectorStore } from '../../stores/useDirectorStore'

export default function ChatWidget() {
  const messagesLen = useDirectorStore((s) => s.messages.length)
  const loading = useDirectorStore((s) => s.loading)
  const attachedShotIndex = useDirectorStore((s) => s.attachedShotIndex)

  // Auto-open the first time the user has nothing yet (so they know where chat is).
  const [open, setOpen] = useState(true)
  const [unread, setUnread] = useState(0)
  const [lastSeen, setLastSeen] = useState(0)

  useEffect(() => {
    if (open) {
      setLastSeen(messagesLen)
      setUnread(0)
    } else {
      setUnread(Math.max(0, messagesLen - lastSeen))
    }
  }, [messagesLen, open, lastSeen])

  // Pop the drawer open whenever the user attaches a shot from the visuals
  // grid, so they can immediately type their change.
  useEffect(() => {
    if (attachedShotIndex !== null) setOpen(true)
  }, [attachedShotIndex])

  const isWorking = loading === 'chat' || loading === 'script'

  return (
    <>
      {/* Drawer */}
      <div
        className={`absolute bottom-5 right-5 z-30 w-[400px] max-w-[calc(100vw-2.5rem)] h-[calc(100vh-7rem)] max-h-[640px] rounded-2xl bg-panel/95 backdrop-blur border border-border-strong shadow-2xl shadow-black/50 overflow-hidden flex flex-col transition-all origin-bottom-right ${
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Close handle */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="absolute top-3.5 right-3.5 z-10 w-7 h-7 rounded-lg bg-card border border-border hover:border-border-strong flex items-center justify-center text-muted-strong hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-h-0">
          <ChatPanel compact />
        </div>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Hide chat' : 'Open chat'}
        className={`absolute bottom-5 right-5 z-40 h-14 w-14 rounded-full flex items-center justify-center shadow-2xl shadow-accent/30 transition-all ${
          open
            ? 'opacity-0 scale-90 pointer-events-none'
            : 'opacity-100 scale-100 bg-accent hover:bg-accent-hover text-white animate-fade-in'
        } ${isWorking ? 'ring-4 ring-accent/30 ring-offset-2 ring-offset-surface' : ''}`}
      >
        <MessageSquare className="w-6 h-6" />
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-white text-accent text-[11px] font-bold flex items-center justify-center border-2 border-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  )
}
