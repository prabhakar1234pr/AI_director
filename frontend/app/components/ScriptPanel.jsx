'use client'

import { useState } from 'react'
import StepIndicator from './StepIndicator'
import ScreenplayView from './ScreenplayView'
import ScriptEditor from './ScriptEditor'
import ShotCard from './ShotCard'
import SlideshowPlayer from './SlideshowPlayer'

export default function ScriptPanel({
  shots,
  shotsWithImages,
  shotsWithAudio,
  scriptJson,
  loading,
  onJsonRawChange,
  onJsonValidChange,
  onGenerateImages,
  onGenerateAudio,
  step,
  maxStep,
  onSetStep,
}) {
  const [showEditor, setShowEditor] = useState(false)

  const hasShots = shots.length > 0
  const hasImages = shotsWithImages.length > 0
  const hasAudio = shotsWithAudio.length > 0
  const isLoading = !!loading

  const imageMap = Object.fromEntries(shotsWithImages.map((s, i) => [i, s.image_b64]))

  // ── Shared header ──────────────────────────────────────────────────────────

  function Header() {
    return (
      <div className="flex-shrink-0 px-4 py-3 border-b border-border space-y-3 bg-panel">
        <StepIndicator currentStep={step} maxStep={maxStep} onGoTo={onSetStep} />
      </div>
    )
  }

  // ── Step 1: Script ─────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        {!hasShots ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 pb-8 px-6">
            <div className="text-4xl opacity-20">🎞</div>
            <p className="text-muted text-sm">Describe a scene in the chat to generate your script.</p>
          </div>
        ) : (
          <>
            {/* Script format toggle */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-[10px] text-muted uppercase tracking-widest font-medium">Script</span>
              <button
                onClick={() => setShowEditor((v) => !v)}
                className="text-[10px] text-muted hover:text-slate-300 transition-colors border border-border rounded px-2 py-0.5 hover:border-muted"
              >
                {showEditor ? 'Screenplay view' : 'Edit JSON'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {showEditor ? (
                <ScriptEditor
                  scriptJson={scriptJson}
                  onRawChange={onJsonRawChange}
                  onValidChange={onJsonValidChange}
                />
              ) : (
                <ScreenplayView shots={shots} />
              )}
            </div>

            {/* Advance to visuals */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-border">
              <button
                onClick={() => onSetStep(2)}
                disabled={!hasShots || isLoading}
                className="w-full h-9 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                Continue to Visuals →
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Step 2: Visuals ────────────────────────────────────────────────────────

  if (step === 2) {
    const allImagesLoaded = hasImages && shotsWithImages.length === shots.length

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center gap-2">
          <button
            onClick={() => onSetStep(1)}
            className="text-xs text-muted hover:text-slate-300 transition-colors"
          >
            ← Revise Script
          </button>
          <div className="flex-1" />
          <button
            onClick={onGenerateImages}
            disabled={isLoading}
            className="h-8 px-4 rounded-lg bg-card border border-border hover:border-accent text-sm text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {loading === 'images' ? (
              <>
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>{hasImages ? '↺ Regenerate All' : '🖼 Generate Visuals'}</>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            {shots.map((shot, i) => (
              <ShotCard
                key={i}
                shot={shot}
                index={i}
                imageB64={imageMap[i]}
                loadingImage={loading === 'images'}
              />
            ))}
          </div>
        </div>

        {allImagesLoaded && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-border">
            <button
              onClick={() => onSetStep(3)}
              className="w-full h-9 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              View Storyboard →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Step 3: Storyboard ─────────────────────────────────────────────────────

  if (step === 3) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-shrink-0 px-4 py-2 border-b border-border flex items-center gap-2">
          <button onClick={() => onSetStep(2)} className="text-xs text-muted hover:text-slate-300 transition-colors">
            ← Visuals
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <p className="text-[10px] text-muted uppercase tracking-widest font-medium">Storyboard</p>

          {/* Horizontal film-strip grid */}
          <div className="space-y-4">
            {shots.map((shot, i) => (
              <div key={i} className="flex gap-4 bg-card rounded-xl border border-border overflow-hidden">
                {/* Frame */}
                <div className="w-48 flex-shrink-0 aspect-video bg-surface">
                  {imageMap[i] ? (
                    <img
                      src={`data:image/png;base64,${imageMap[i]}`}
                      alt={`Shot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Shot details in screenplay style */}
                <div className="flex-1 py-3 pr-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold tracking-wide">
                      SHOT {i + 1} — {shot.shot?.toUpperCase()}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                      shot.type === 'dialogue'
                        ? 'bg-purple-900/40 text-purple-300 border-purple-800/50'
                        : shot.type === 'action'
                        ? 'bg-orange-900/40 text-orange-300 border-orange-800/50'
                        : 'bg-blue-900/40 text-blue-300 border-blue-800/50'
                    }`}>
                      {shot.type}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed line-clamp-2">{shot.visual}</p>
                  {shot.audio && (
                    <p className="text-slate-300 italic">
                      &ldquo;{shot.audio}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-3 border-t border-border">
          <button
            onClick={() => onSetStep(4)}
            className="w-full h-9 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            Add Narration →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 4: Narration ──────────────────────────────────────────────────────

  if (step === 4) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-shrink-0 px-4 py-2 border-b border-border flex items-center gap-2">
          <button onClick={() => onSetStep(3)} className="text-xs text-muted hover:text-slate-300 transition-colors">
            ← Storyboard
          </button>
          <div className="flex-1" />
          <button
            onClick={onGenerateAudio}
            disabled={isLoading}
            className="h-8 px-4 rounded-lg bg-card border border-border hover:border-accent text-sm text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {loading === 'audio' ? (
              <>
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                Recording...
              </>
            ) : (
              <>{hasAudio ? '↺ Re-record' : '🎙 Generate Audio'}</>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {hasImages ? (
            <SlideshowPlayer
              shotsWithImages={shotsWithImages}
              shotsWithAudio={hasAudio ? shotsWithAudio : null}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              Go back to generate visuals first.
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
