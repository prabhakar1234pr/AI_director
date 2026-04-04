"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function PlaybackTab({ script, currentSlide, isPlaying, onSlideChange, onPlayingChange }) {
  const audioRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  const shots = script || [];
  const current = shots[currentSlide] || null;

  // Sync audio when slide or play state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audio_url) return;

    if (audio.src !== current.audio_url) {
      audio.src = current.audio_url;
      audio.load();
    }
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [currentSlide, isPlaying, current?.audio_url]);

  // Timer for progress
  useEffect(() => {
    clearInterval(timerRef.current);
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (audio) { setElapsed(audio.currentTime); setDuration(audio.duration || 0); }
      }, 200);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  function handleEnded() {
    if (currentSlide < shots.length - 1) {
      setElapsed(0);
      onSlideChange(currentSlide + 1);
    } else {
      onPlayingChange(false);
    }
  }

  function togglePlay() {
    onPlayingChange(!isPlaying);
  }

  function goPrev() {
    if (currentSlide > 0) { setElapsed(0); onSlideChange(currentSlide - 1); }
  }

  function goNext() {
    if (currentSlide < shots.length - 1) { setElapsed(0); onSlideChange(currentSlide + 1); }
  }

  function fmt(s) {
    const m = Math.floor((s || 0) / 60);
    const sec = Math.floor((s || 0) % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  if (!shots.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3" style={{ background: "#0A0A0F" }}>
        <div className="text-4xl opacity-20">▶</div>
        <p className="text-sm" style={{ color: "#64748B" }}>Generate audio first to enable playback</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ background: "#0A0A0F" }}>
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={handleEnded} />

      {/* Main image area */}
      <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        {current?.image_url ? (
          <Image src={current.image_url} alt={current.visual || ""} fill className="object-cover" unoptimized priority />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#13131A" }}>
            <div className="text-6xl opacity-10">🎬</div>
          </div>
        )}

        {/* Scene overlay */}
        <div className="absolute top-0 left-0 right-0 p-4" style={{ background: "linear-gradient(rgba(0,0,0,0.6), transparent)" }}>
          <p className="text-xs font-mono uppercase tracking-widest mb-0.5" style={{ color: "#8B5CF6" }}>
            SCENE {String(currentSlide + 1).padStart(2, "0")}
          </p>
          <h2 className="text-xl font-bold uppercase tracking-wide" style={{ color: "#F1F5F9" }}>
            {current?.shot || ""}
          </h2>
        </div>

        {/* Director's note card */}
        {current?.audio && (
          <div className="absolute right-4 top-16 w-48 rounded-lg p-3" style={{ background: "rgba(13,13,20,0.9)", border: "1px solid #1E1E2E", backdropFilter: "blur(8px)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#8B5CF6" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B5CF6" }}>Director&apos;s Note</span>
            </div>
            <p className="text-xs italic leading-relaxed" style={{ color: "#CBD5E1" }}>
              &ldquo;{current.audio}&rdquo;
            </p>
            {current.voice_name && (
              <p className="text-xs mt-1.5" style={{ color: "#64748B" }}>Voice: {current.voice_name}</p>
            )}
          </div>
        )}

        {/* Progress indicator */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 2, background: "#1E1E2E" }}>
          <div
            className="h-full transition-all"
            style={{
              width: duration > 0 ? `${(elapsed / duration) * 100}%` : "0%",
              background: "linear-gradient(90deg, #7C3AED, #8B5CF6)",
            }}
          />
        </div>
      </div>

      {/* Controls bar */}
      <div className="shrink-0 px-4 py-3 border-t" style={{ background: "#0D0D14", borderColor: "#1E1E2E" }}>
        <div className="flex items-center gap-4">
          {/* Waveform animation */}
          <div className="flex items-end gap-0.5 h-6">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full"
                style={{
                  background: "#8B5CF6",
                  height: isPlaying ? `${30 + Math.sin(i * 0.8) * 50}%` : "20%",
                  transition: "height 0.15s ease",
                  animation: isPlaying ? `wave 1.2s ease-in-out ${i * 0.1}s infinite` : "none",
                  opacity: isPlaying ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Time */}
          <span className="text-xs font-mono" style={{ color: "#64748B" }}>
            {fmt(elapsed)} / {fmt(duration)}
          </span>

          {/* Transport controls */}
          <div className="flex items-center gap-3 mx-auto">
            <button onClick={goPrev} disabled={currentSlide === 0} className="transition-all disabled:opacity-30 hover:opacity-70" style={{ color: "#94A3B8" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            </button>
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)" }}
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>
            <button onClick={goNext} disabled={currentSlide === shots.length - 1} className="transition-all disabled:opacity-30 hover:opacity-70" style={{ color: "#94A3B8" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
            </button>
          </div>

          {/* Slide counter */}
          <span className="text-xs font-mono ml-auto" style={{ color: "#64748B" }}>
            {currentSlide + 1} / {shots.length}
          </span>
        </div>

        {/* Film strip */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {shots.map((shot, i) => (
            <button
              key={i}
              onClick={() => { onSlideChange(i); }}
              className="relative shrink-0 rounded overflow-hidden transition-all hover:opacity-80"
              style={{
                width: 64,
                height: 36,
                border: i === currentSlide ? "2px solid #8B5CF6" : "2px solid #1E1E2E",
                background: "#13131A",
              }}
            >
              {shot.image_url ? (
                <Image src={shot.image_url} alt={shot.shot || ""} fill className="object-cover" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#1E1E2E" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
                </div>
              )}
              {i === currentSlide && (
                <div className="absolute inset-0" style={{ background: "rgba(139,92,246,0.15)" }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
