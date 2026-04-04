"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const STAGE_LABELS = {
  chatting: "Thinking…",
  generating_images: "Generating storyboard…",
  generating_audio: "Generating audio…",
};

export default function ChatPanel({ messages, stage, hasScript, onSend, onRegenerate }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const isBusy = stage === "chatting" || stage === "generating_images" || stage === "generating_audio";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    if (!input.trim() || isBusy) return;
    onSend(input);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleInput(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  return (
    <div className="flex flex-col border-r shrink-0" style={{ width: "40%", background: "#0D0D14", borderColor: "#1E1E2E" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#1E1E2E" }}>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#64748B" }}>Cinematic Intelligence</span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1E1E2E", color: "#8B5CF6" }}>M2.5</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <Image src="/logo.png" alt="AI Director" width={48} height={48} className="opacity-40" />
            <p className="text-sm" style={{ color: "#64748B" }}>
              Describe a scene to begin.<br />
              <span className="text-xs opacity-60">e.g. "A detective waits in a rainy alley at night"</span>
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: "#1E1E2E" }}>
                <Image src="/logo.png" alt="AI" width={16} height={16} />
              </div>
            )}
            <div
              className="max-w-[82%] rounded-lg px-3 py-2 text-sm leading-relaxed"
              style={{
                background: msg.role === "user" ? "#1E1E2E" : "#13131A",
                color: "#E2E8F0",
                border: `1px solid ${msg.role === "user" ? "#2D2D3E" : "#1E1E2E"}`,
              }}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isBusy && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: "#1E1E2E" }}>
              <Image src="/logo.png" alt="AI" width={16} height={16} />
            </div>
            <div className="flex items-center gap-1 rounded-lg px-3 py-2" style={{ background: "#13131A", border: "1px solid #1E1E2E" }}>
              {STAGE_LABELS[stage] ? (
                <span className="text-xs" style={{ color: "#8B5CF6" }}>{STAGE_LABELS[stage]}</span>
              ) : (
                <>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: "#8B5CF6", animation: `wave 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Regenerate button */}
        {hasScript && !isBusy && (
          <button onClick={onRegenerate} className="w-full text-xs py-1.5 rounded transition-all hover:opacity-80" style={{ border: "1px solid #1E1E2E", color: "#8B5CF6", background: "transparent" }}>
            ↺ Regenerate Script
          </button>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: "#1E1E2E" }}>
        <div className="flex items-end gap-2 rounded-lg px-3 py-2" style={{ background: "#13131A", border: "1px solid #1E1E2E" }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            rows={1}
            placeholder="Describe your scene…"
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-600 disabled:opacity-50"
            style={{ color: "#F1F5F9", maxHeight: 120 }}
          />
          <button
            onClick={submit}
            disabled={isBusy || !input.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all disabled:opacity-40 hover:opacity-80"
            style={{ background: "#7C3AED" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
