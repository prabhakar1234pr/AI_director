'use client'

import { useState } from 'react'
import {
  Code2,
  Film,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  RotateCcw,
  ScrollText,
} from 'lucide-react'
import CeltxView from './CeltxView'
import ScriptEditor from './ScriptEditor'
import ShotCard from './ShotCard'
import ComicStoryboard from './ComicStoryboard'
import SlideshowPlayer from './SlideshowPlayer'
import { useDirectorStore, VIEWS, VIEW_LABEL } from '../stores/useDirectorStore'

const VIEW_ICON = {
  script: FileText,
  visuals: ImageIcon,
  storyboard: Film,
  narration: Mic,
}

function ViewTabs() {
  const view = useDirectorStore((s) => s.view)
  const setView = useDirectorStore((s) => s.setView)

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-panel/80 backdrop-blur border border-border-strong shadow-lg shadow-black/30">
      {VIEWS.map((v) => {
        const Icon = VIEW_ICON[v]
        const active = view === v
        return (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              active
                ? 'bg-accent text-white shadow-sm shadow-accent/30'
                : 'text-muted-strong hover:text-white hover:bg-card'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {VIEW_LABEL[v]}
          </button>
        )
      })}
    </div>
  )
}

export default function ScriptPanel() {
  const view = useDirectorStore((s) => s.view)
  const shots = useDirectorStore((s) => s.shots)
  const shotsWithImages = useDirectorStore((s) => s.shotsWithImages)
  const loading = useDirectorStore((s) => s.loading)
  const generateImages = useDirectorStore((s) => s.generateImages)
  const generateAudio = useDirectorStore((s) => s.generateAudio)
  const hasAudio = useDirectorStore((s) => s.shotsWithAudio.length > 0)

  const [showEditor, setShowEditor] = useState(false)

  const hasShots = shots.length > 0
  const hasImages = shotsWithImages.length > 0
  const isLoading = !!loading

  // ── Empty playground ────────────────────────────────────────────────────

  function EmptyState({ icon: Icon, title, hint }) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Icon className="w-7 h-7 text-muted-strong" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-semibold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-strong leading-relaxed">{hint}</p>
        </div>
      </div>
    )
  }

  // ── Body per view ───────────────────────────────────────────────────────

  let body
  if (view === 'script') {
    if (!hasShots) {
      body = (
        <EmptyState
          icon={ScrollText}
          title="Your screenplay will appear here"
          hint="Open the chat in the bottom-right and pitch a scene. The director will turn it into a properly-formatted screenplay."
        />
      )
    } else {
      body = (
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-1.5 border-b border-border bg-panel/60 backdrop-blur">
            <div className="flex items-center gap-1.5">
              <ScrollText className="w-3.5 h-3.5 text-muted-strong" />
              <span className="text-xs font-medium text-white tracking-tight">
                Screenplay
              </span>
              <span className="text-[11px] text-muted ml-0.5">
                · {shots.length} shot{shots.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowEditor((v) => !v)}
              className="text-[11px] text-muted-strong hover:text-white transition-colors border border-border hover:border-border-strong rounded-md px-2 py-0.5 flex items-center gap-1 font-medium bg-card"
            >
              <Code2 className="w-3 h-3" />
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
        </div>
      )
    }
  } else if (view === 'visuals') {
    if (!hasShots) {
      body = (
        <EmptyState
          icon={ImageIcon}
          title="No script yet"
          hint="Write a script first, then come back here to generate cinematic visuals."
        />
      )
    } else {
      body = (
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 px-5 py-1.5 border-b border-border bg-panel/60 backdrop-blur flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-muted-strong" />
              <span className="text-xs font-medium text-white tracking-tight">
                Visuals
              </span>
              <span className="text-[11px] text-muted ml-0.5">
                · {hasImages ? `${shotsWithImages.length} of ${shots.length}` : `${shots.length} pending`}
              </span>
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={generateImages}
              disabled={isLoading}
              className="h-7 px-3 rounded-md bg-accent hover:bg-accent-hover disabled:bg-card disabled:text-muted disabled:border disabled:border-border disabled:cursor-not-allowed text-xs font-medium text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-accent/20"
            >
              {loading === 'images' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating…
                </>
              ) : hasImages ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Regenerate All
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
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
        </div>
      )
    }
  } else if (view === 'storyboard') {
    if (!hasShots) {
      body = (
        <EmptyState
          icon={Film}
          title="No storyboard yet"
          hint="Once you have a script, this becomes a real comic-book page with your panels and dialogue."
        />
      )
    } else {
      body = (
        <div className="h-full overflow-y-auto scrollbar-thin">
          <ComicStoryboard shots={shots} shotsWithImages={shotsWithImages} />
        </div>
      )
    }
  } else if (view === 'narration') {
    if (!hasImages) {
      body = (
        <EmptyState
          icon={Mic}
          title="Generate visuals first"
          hint="Once you have visuals, you can play them back as a narrated slideshow here."
        />
      )
    } else {
      body = (
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 px-5 py-1.5 border-b border-border bg-panel/60 backdrop-blur flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-muted-strong" />
              <span className="text-xs font-medium text-white tracking-tight">
                Narration
              </span>
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={generateAudio}
              disabled={isLoading}
              className="h-7 px-3 rounded-md bg-accent hover:bg-accent-hover disabled:bg-card disabled:text-muted disabled:border disabled:border-border disabled:cursor-not-allowed text-xs font-medium text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-accent/20"
            >
              {loading === 'audio' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Recording…
                </>
              ) : hasAudio ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-record
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  Generate Audio
                </>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
            <div className="max-w-3xl mx-auto">
              <SlideshowPlayer />
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="relative h-full">
      {/* Floating view tabs — pinned to top, centered */}
      <div className="pointer-events-none absolute top-3 inset-x-0 flex justify-center z-20">
        <div className="pointer-events-auto">
          <ViewTabs />
        </div>
      </div>

      {/* Body — pushed below the floating tabs */}
      <div className="h-full pt-12">{body}</div>
    </div>
  )
}
