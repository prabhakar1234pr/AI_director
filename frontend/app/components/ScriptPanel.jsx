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
import CeltxView from './CeltxView'
import ScriptEditor from './ScriptEditor'
import ShotCard from './ShotCard'
import ComicStoryboard from './ComicStoryboard'
import SlideshowPlayer from './SlideshowPlayer'
import { useDirectorStore } from '../stores/useDirectorStore'

export default function ScriptPanel() {
  const shots = useDirectorStore((s) => s.shots)
  const shotsWithImages = useDirectorStore((s) => s.shotsWithImages)
  const shotsWithAudio = useDirectorStore((s) => s.shotsWithAudio)
  const loading = useDirectorStore((s) => s.loading)
  const step = useDirectorStore((s) => s.step)
  const setStep = useDirectorStore((s) => s.setStep)
  const generateImages = useDirectorStore((s) => s.generateImages)
  const generateAudio = useDirectorStore((s) => s.generateAudio)
  const maxStep = useDirectorStore((s) => s.maxStep())

  const [showEditor, setShowEditor] = useState(false)

  const hasShots = shots.length > 0
  const hasImages = shotsWithImages.length > 0
  const hasAudio = shotsWithAudio.length > 0
  const isLoading = !!loading

  function Header() {
    return (
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-panel/60 backdrop-blur">
        <StepIndicator currentStep={step} maxStep={maxStep} onGoTo={setStep} />
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
                Pitch a scene in the chat panel. The director will turn it into a properly-formatted screenplay.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-muted-strong" />
                <span className="text-sm font-medium text-white tracking-tight">
                  Screenplay
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

            <div className="flex-1 overflow-y-auto bg-[#1c1c1c] scrollbar-thin">
              {showEditor ? (
                <div className="px-6 py-5">
                  <ScriptEditor />
                </div>
              ) : (
                <CeltxView shots={shots} />
              )}
            </div>

            <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-panel/60">
              <button
                type="button"
                onClick={() => setStep(2)}
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
            onClick={() => setStep(1)}
            className="text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Revise Script
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={generateImages}
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
              <ShotCard key={i} shot={shot} index={i} />
            ))}
          </div>
        </div>

        {allImagesLoaded && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-panel/60">
            <button
              type="button"
              onClick={() => setStep(3)}
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
            onClick={() => setStep(2)}
            className="text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Visuals
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-muted">
            <Film className="w-4 h-4" />
            {shots.length} panels
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ComicStoryboard shots={shots} shotsWithImages={shotsWithImages} />
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-panel/60">
          <button
            type="button"
            onClick={() => setStep(4)}
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
            onClick={() => setStep(3)}
            className="text-sm text-muted-strong hover:text-white transition-colors flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Storyboard
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={generateAudio}
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
              <SlideshowPlayer />
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
