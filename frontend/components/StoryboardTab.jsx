"use client";
import { useState } from "react";
import Image from "next/image";

const STYLES = ["Cinematic", "Noir", "Anime", "Sci-fi", "Horror", "Documentary", "Fantasy", "Cartoon"];

export default function StoryboardTab({ script, stage, style, onRegenerateImage, onGenerateAudio, onGenerateImages }) {
  const [selectedStyle, setSelectedStyle] = useState(style || "Cinematic");
  const [styleOpen, setStyleOpen] = useState(false);
  const isGenerating = stage === "generating_images";
  const isGeneratingAudio = stage === "generating_audio";
  const hasAudio = script?.some((s) => s.audio_url);
  const hasImages = script?.some((s) => s.image_url);

  if (!script) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3" style={{ background: "#0A0A0F" }}>
        <div className="text-4xl opacity-20">🖼</div>
        <p className="text-sm" style={{ color: "#64748B" }}>Generate a script first, then create your storyboard</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ background: "#0A0A0F" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b shrink-0" style={{ borderColor: "#1E1E2E", background: "#0D0D14" }}>
        {/* Style selector */}
        <div className="relative">
          <button onClick={() => setStyleOpen(!styleOpen)} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded" style={{ background: "#1E1E2E", color: "#94A3B8", border: "1px solid #2D2D3E" }}>
            Style: {selectedStyle} ▾
          </button>
          {styleOpen && (
            <div className="absolute left-0 top-full mt-1 rounded-lg overflow-hidden z-10 shadow-xl" style={{ background: "#13131A", border: "1px solid #1E1E2E", minWidth: 140 }}>
              {STYLES.map((s) => (
                <button key={s} onClick={() => { setSelectedStyle(s); setStyleOpen(false); }} className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[#1E1E2E] transition-colors" style={{ color: selectedStyle === s ? "#8B5CF6" : "#94A3B8" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {!hasImages && !isGenerating && (
          <button
            onClick={onGenerateImages}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "white" }}
          >
            ✦ Generate Storyboard
          </button>
        )}

        <button
          onClick={onGenerateAudio}
          disabled={!hasImages || isGeneratingAudio || hasAudio}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-semibold transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)", color: "white" }}
        >
          {isGeneratingAudio ? (
            <><div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" /> Generating Audio…</>
          ) : hasAudio ? (
            "▶ Play Scene"
          ) : (
            "▶ Generate Audio & Playback"
          )}
        </button>
      </div>

      {/* Image grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {script.map((shot, i) => (
            <ShotCard key={i} shot={shot} idx={i} isGenerating={isGenerating} onRegenerate={() => onRegenerateImage(i)} />
          ))}
        </div>

        {/* Stats bar */}
        {hasImages && (
          <div className="flex gap-6 mt-4 pt-3 border-t text-xs" style={{ borderColor: "#1E1E2E", color: "#64748B" }}>
            <span>GENERATED FRAMES: <strong style={{ color: "#94A3B8" }}>{script.filter((s) => s.image_url).length}</strong></span>
            <span>STYLE: <strong style={{ color: "#94A3B8" }}>{selectedStyle}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}

function ShotCard({ shot, idx, isGenerating, onRegenerate }) {
  const loading = isGenerating && !shot.image_url;

  return (
    <div className="relative rounded-lg overflow-hidden group" style={{ background: "#13131A", border: "1px solid #1E1E2E", aspectRatio: "16/9" }}>
      {loading ? (
        <div className="skeleton absolute inset-0 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : shot.image_url ? (
        <>
          <Image src={shot.image_url} alt={shot.visual} fill className="object-cover" unoptimized />
          {/* Shot label overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
            <span className="text-xs font-semibold uppercase" style={{ color: "#F1F5F9" }}>{shot.shot}</span>
          </div>
          {/* Regenerate button */}
          <button
            onClick={onRegenerate}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center justify-center h-7 w-7 rounded-full transition-all hover:scale-110"
            style={{ background: "rgba(0,0,0,0.7)", color: "#8B5CF6", backdropFilter: "blur(4px)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ color: "#1E1E2E" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
          <span className="text-xs" style={{ color: "#64748B" }}>{shot.shot}</span>
        </div>
      )}
    </div>
  );
}
