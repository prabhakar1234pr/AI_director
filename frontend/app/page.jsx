'use client'

import { useReducer, useCallback } from 'react'
import ChatPanel from './components/ChatPanel'
import ScriptPanel from './components/ScriptPanel'
import StatusBar from './components/StatusBar'
import { useApi } from './hooks/useApi'

// ── State ───────────────────────────────────────────────────────────────────

const initialState = {
  messages: [],
  shots: [],
  scriptJson: '',
  shotsWithImages: [],
  shotsWithAudio: [],
  loading: null,     // 'script' | 'images' | 'audio' | null
  error: null,
  style: '',
  step: 1,           // 1: Script | 2: Visuals | 3: Storyboard | 4: Narration
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'CLEAR_LOADING':
      return { ...state, loading: null }

    case 'SET_SCRIPT':
      return {
        ...state,
        shots: action.payload,
        scriptJson: JSON.stringify(action.payload, null, 2),
        // Reset downstream when script changes
        shotsWithImages: [],
        shotsWithAudio: [],
      }

    case 'UPDATE_SCRIPT_JSON':
      return { ...state, scriptJson: action.payload }

    case 'UPDATE_SHOTS':
      return {
        ...state,
        shots: action.payload,
        shotsWithImages: [],
        shotsWithAudio: [],
      }

    case 'SET_IMAGES':
      return { ...state, shotsWithImages: action.payload }

    case 'SET_AUDIO':
      return { ...state, shotsWithAudio: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    case 'SET_STYLE':
      return { ...state, style: action.payload }

    case 'SET_STEP':
      return { ...state, step: action.payload }

    case 'RESET':
      return { ...initialState }

    default:
      return state
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { sendChatMessage, generateImages, generateAudio } = useApi(dispatch)

  // Unlock steps based on what's been generated
  const maxStep = state.shots.length === 0 ? 1
    : state.shotsWithImages.length === 0 ? 2
    : 4

  const handleSetStep = useCallback((s) => {
    dispatch({ type: 'SET_STEP', payload: s })
  }, [])

  // ── Chat ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(
    (text) => {
      const userMsg = { role: 'user', content: text }
      dispatch({ type: 'ADD_MESSAGE', payload: userMsg })
      const updatedMessages = [...state.messages, userMsg]
      sendChatMessage(updatedMessages, state.style)
    },
    [state.messages, state.style, sendChatMessage]
  )

  // ── Script editing ────────────────────────────────────────────────────────

  const handleJsonRawChange = useCallback((raw) => {
    dispatch({ type: 'UPDATE_SCRIPT_JSON', payload: raw })
  }, [])

  const handleJsonValidChange = useCallback((parsed) => {
    dispatch({ type: 'UPDATE_SHOTS', payload: parsed })
  }, [])

  // ── Generation ────────────────────────────────────────────────────────────

  const handleGenerateImages = useCallback(() => {
    generateImages(state.shots, state.style)
  }, [state.shots, state.style, generateImages])

  const handleGenerateAudio = useCallback(() => {
    generateAudio(state.shots)
  }, [state.shots, generateAudio])

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <StatusBar
        loading={state.loading}
        error={state.error}
        onDismissError={() => dispatch({ type: 'CLEAR_ERROR' })}
      />

      <div
        className="flex flex-col min-h-screen bg-surface"
        style={{ paddingTop: state.loading || state.error ? '48px' : '0' }}
      >
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-panel">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎬</span>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">AI Director</h1>
              <p className="text-xs text-muted">Scene → Storyboard → Narration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={state.style}
              onChange={(e) => dispatch({ type: 'SET_STYLE', payload: e.target.value })}
              placeholder="Visual style (e.g. noir, anime, cinematic)"
              className="w-60 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-muted focus:outline-none focus:border-accent"
            />
            <button
              onClick={handleReset}
              className="text-xs text-muted hover:text-slate-300 px-3 py-1.5 rounded-lg border border-border hover:border-muted transition-colors"
            >
              ↺ New Scene
            </button>
          </div>
        </header>

        {/* Main layout */}
        <main className="flex flex-1 overflow-hidden">
          {/* Left: Chat — visible on step 1 only */}
          {state.step === 1 && (
            <div className="w-[38%] border-r border-border flex-shrink-0">
              <ChatPanel
                messages={state.messages}
                loading={state.loading}
                onSend={handleSend}
              />
            </div>
          )}

          {/* Right: Step panel */}
          <div className="flex-1 min-w-0">
            <ScriptPanel
              shots={state.shots}
              shotsWithImages={state.shotsWithImages}
              shotsWithAudio={state.shotsWithAudio}
              scriptJson={state.scriptJson}
              loading={state.loading}
              onJsonRawChange={handleJsonRawChange}
              onJsonValidChange={handleJsonValidChange}
              onGenerateImages={handleGenerateImages}
              onGenerateAudio={handleGenerateAudio}
              style={state.style}
              step={state.step}
              maxStep={maxStep}
              onSetStep={handleSetStep}
            />
          </div>
        </main>
      </div>
    </>
  )
}
