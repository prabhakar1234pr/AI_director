'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Code2,
  Film,
  Image as ImageIcon,
  Loader2,
  Mic,
  RotateCcw,
  ScrollText,
} from 'lucide-react'
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

  function Header() {
    return (
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-panel/60 backdrop-blur">
        <StepIndicator currentStep={step} maxStep={maxStep} onGoTo={onSetStep} />
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        {!hasShots ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-6">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
              <ScrollText className="w-7 h-7 text-muted-strong" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Your script will appear here
              </h3>
              <p className="text-sm text-muted-strong leading-relaxed">
                Pitch a scene in the chat panel. The director will turn it into shots you can review and edit.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-muted-strong" />
                <span className="text-sm font-medium text-white tracking-tight">
                  Script
                </span>
                <span className="text-xs text-muted ml-1">
                  · {shots.length} shot{shots.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowEditor((v) => !v)}
                className="text-xs text-muted-strong hover:text-white transition-colors border border-border hover:border-border-strong rounded-md px-2.5 py-1 flex items-center gap-1.5 font-medium"
              >
                <Code2 className="w-3.5 h-3.5" />
                {showEditor ? 'Screenplay view' : 'Edit JSON'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
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

            <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-panel/60">
              <button
                type="button"
                onClick={() => onSetStep(2)}
                disabled={!hasShots || isLoading}
                className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm shadow-accent/20"
              >
                Continue to Visuals
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  if (step === 2) {
    const allImagesLoaded = hasImages && shotsWithImages.length === shots.length

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-shrink-0 px-6 py-3 border-b border-border flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSetStep(1)}
            className="text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Revise Script
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onGenerateImages}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover disabled:bg-card disabled:text-muted disabled:border disabled:border-border disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-2 shadow-sm shadow-accent/20"
          >
            {loading === 'images' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : hasImages ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Regenerate All
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Generate Visuals
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-panel/60">
            <button
              type="button"
              onClick={() => onSetStep(3)}
              className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-accent/20"
            >
              View Storyboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-shrink-0 px-6 py-3 border-b border-border flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSetStep(2)}
            className="text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Visuals
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-muted">
            <Film className="w-4 h-4" />
            {shots.length} shots
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {shots.map((shot, i) => (
              <article
                key={i}
                className="flex bg-card rounded-xl border border-border overflow-hidden hover:border-border-strong transition-colors"
              >
                <div className="w-40 sm:w-48 flex-shrink-0 aspect-video bg-surface">
                  {imageMap[i] ? (
                    <img
                      src={`data:image/jpeg;base64,${imageMap[i]}`}
                      alt={`Shot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <Film className="w-6 h-6 opacity-40" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-3 px-4 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-mono font-bold tracking-wider text-xs">
                      SHOT {i + 1}
                    </span>
                    <span className="text-muted-strong text-xs font-mono uppercase tracking-wider">
                      {shot.shot}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wider ${
                        shot.type === 'dialogue'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : shot.type === 'action'
                          ? 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                          : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                      }`}
                    >
                      {shot.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-strong leading-relaxed line-clamp-3">
                    {shot.visual}
                  </p>
                  {shot.audio && (
                    <p className="text-xs text-slate-200 italic leading-relaxed line-clamp-2">
                      &ldquo;{shot.audio}&rdquo;
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-panel/60">
          <button
            type="button"
            onClick={() => onSetStep(4)}
            className="w-full h-11 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm shadow-accent/20"
          >
            Add Narration
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Header />

        <div className="flex-shrink-0 px-6 py-3 border-b border-border flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSetStep(3)}
            className="text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Storyboard
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onGenerateAudio}
            disabled={isLoading}
            className="h-9 px-4 rounded-lg bg-accent hover:bg-accent-hover disabled:bg-card disabled:text-muted disabled:border disabled:border-border disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-2 shadow-sm shadow-accent/20"
          >
            {loading === 'audio' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Recording…
              </>
            ) : hasAudio ? (
              <>
                <RotateCcw className="w-4 h-4" />
                Re-record
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Generate Audio
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          {hasImages ? (
            <div className="max-w-3xl mx-auto">
              <SlideshowPlayer
                shotsWithImages={shotsWithImages}
                shotsWithAudio={hasAudio ? shotsWithAudio : null}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-muted">
              <Film className="w-8 h-8 opacity-40" />
              <p className="text-sm">Go back to generate visuals first.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
