'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { API_BASE } from '../utils/constants'

export const VIEWS = ['script', 'visuals', 'storyboard', 'narration']

const STORAGE_KEY = 'ai-director-store'
const STORAGE_VERSION = 1

// Wraps localStorage so quota errors (large base64 images) don't break the
// store: on first failure we retry with images/audio stripped, then give up.
function createSafeLocalStorage() {
  if (typeof window === 'undefined') return undefined
  return {
    getItem: (name) => {
      try { return window.localStorage.getItem(name) } catch { return null }
    },
    setItem: (name, value) => {
      try {
        window.localStorage.setItem(name, value)
      } catch {
        try {
          const parsed = JSON.parse(value)
          if (parsed?.state) {
            parsed.state.shotsWithImages = []
            parsed.state.shotsWithAudio = []
            window.localStorage.setItem(name, JSON.stringify(parsed))
            // eslint-disable-next-line no-console
            console.warn(
              '[ai-director] localStorage quota exceeded; image data was not persisted.'
            )
          }
        } catch {
          /* give up silently */
        }
      }
    },
    removeItem: (name) => {
      try { window.localStorage.removeItem(name) } catch { /* ignore */ }
    },
  }
}

const initialState = {
  messages: [],
  shots: [],
  scriptJson: '',
  shotsWithImages: [],
  shotsWithAudio: [],
  loading: null,
  error: null,
  style: '',
  view: 'script',
  regeneratingIndices: [],
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Request failed (${res.status})`)
  }
  return res.json()
}

export const useDirectorStore = create(
  persist(
    (set, get) => ({
  ...initialState,

  // ── Pure setters ─────────────────────────────────────────────────────────

  setView: (view) => {
    if (VIEWS.includes(view)) set({ view })
  },
  setStyle: (style) => set({ style }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () => set({ ...initialState }),

  setScriptJsonRaw: (raw) => set({ scriptJson: raw }),
  applyValidScript: (parsed) =>
    set({ shots: parsed, shotsWithImages: [], shotsWithAudio: [] }),

  pushMessage: (msg) => set({ messages: [...get().messages, msg] }),

  // ── Mutations on shots (called by chat actions or UI) ────────────────────

  editShot: (index, patch) => {
    const shots = get().shots.slice()
    if (index < 0 || index >= shots.length) return
    shots[index] = { ...shots[index], ...patch }
    set({
      shots,
      scriptJson: JSON.stringify(shots, null, 2),
    })
  },

  addShot: (afterIndex, shot) => {
    const shots = get().shots.slice()
    const insertAt = Math.max(0, Math.min(shots.length, afterIndex + 1))
    shots.splice(insertAt, 0, shot)
    set({
      shots,
      scriptJson: JSON.stringify(shots, null, 2),
      shotsWithImages: [],
      shotsWithAudio: [],
    })
  },

  deleteShot: (index) => {
    const shots = get().shots.filter((_, i) => i !== index)
    set({
      shots,
      scriptJson: JSON.stringify(shots, null, 2),
      shotsWithImages: get().shotsWithImages.filter((_, i) => i !== index),
      shotsWithAudio: get().shotsWithAudio.filter((_, i) => i !== index),
    })
  },

  reorderShots: (order) => {
    const { shots, shotsWithImages, shotsWithAudio } = get()
    if (!Array.isArray(order) || order.length !== shots.length) return
    const newShots = order.map((i) => shots[i])
    const newImages =
      shotsWithImages.length === shots.length
        ? order.map((i) => shotsWithImages[i])
        : []
    const newAudio =
      shotsWithAudio.length === shots.length
        ? order.map((i) => shotsWithAudio[i])
        : []
    set({
      shots: newShots,
      scriptJson: JSON.stringify(newShots, null, 2),
      shotsWithImages: newImages,
      shotsWithAudio: newAudio,
    })
  },

  // ── API: script generation (legacy first-time flow) ──────────────────────

  generateScriptFromMessages: async () => {
    const { messages, style } = get()
    set({ loading: 'script', error: null })
    try {
      const data = await postJson('/generate-script', {
        messages,
        style: style || undefined,
      })
      if (data.ready && data.shots) {
        set({
          messages: [
            ...get().messages,
            {
              role: 'assistant',
              content: `Script ready — ${data.shots.length} shots generated.`,
            },
          ],
          shots: data.shots,
          scriptJson: JSON.stringify(data.shots, null, 2),
          shotsWithImages: [],
          shotsWithAudio: [],
        })
      } else if (data.question) {
        set({
          messages: [
            ...get().messages,
            { role: 'assistant', content: data.question },
          ],
        })
      }
    } catch (e) {
      set({ error: e.message })
    } finally {
      set({ loading: null })
    }
  },

  // ── API: cursor-style chat ───────────────────────────────────────────────

  sendChat: async (text) => {
    const userMsg = { role: 'user', content: text }
    set({ messages: [...get().messages, userMsg], error: null })

    const s = get()
    const context = {
      page: s.view,
      shots: s.shots,
      style: s.style || null,
      has_images: s.shotsWithImages.length > 0,
      has_audio: s.shotsWithAudio.length > 0,
    }

    set({ loading: 'chat' })
    try {
      const data = await postJson('/chat', {
        messages: [...s.messages, userMsg],
        context,
      })
      const action = data.action
      // For most actions: push the assistant reply first.
      // For generate_script we let the script generator add its own success
      // message (and we don't want a stray "got it" turn in the prompt).
      if (action.reply && action.type !== 'generate_script') {
        set({
          messages: [
            ...get().messages,
            { role: 'assistant', content: action.reply },
          ],
        })
      }
      set({ loading: null })

      switch (action.type) {
        case 'reply':
          break
        case 'generate_script':
          await get().generateScriptFromMessages()
          break
        case 'edit_shot':
          get().editShot(action.index, action.patch || {})
          break
        case 'add_shot':
          get().addShot(action.after_index ?? -1, action.shot)
          break
        case 'delete_shot':
          get().deleteShot(action.index)
          break
        case 'reorder_shots':
          get().reorderShots(action.order)
          break
        case 'set_style':
          set({ style: action.style })
          break
        case 'regenerate_image':
          await get().regenerateImage(action.index, action.instructions || null)
          break
        default:
          break
      }
    } catch (e) {
      set({ error: e.message, loading: null })
    }
  },

  // ── API: image generation ────────────────────────────────────────────────

  generateImages: async () => {
    const { shots, style } = get()
    if (shots.length === 0) return
    set({ loading: 'images', error: null })
    try {
      const data = await postJson('/generate-images', {
        shots,
        style: style || 'cinematic, photorealistic, dramatic lighting',
      })
      set({ shotsWithImages: data.shots })
    } catch (e) {
      set({ error: e.message })
    } finally {
      set({ loading: null })
    }
  },

  regenerateImage: async (index, instructions) => {
    const { shots, shotsWithImages, style, regeneratingIndices } = get()
    if (index < 0 || index >= shots.length) return
    set({ regeneratingIndices: [...regeneratingIndices, index], error: null })
    try {
      const data = await postJson('/regenerate-image', {
        shot: shots[index],
        style: style || 'cinematic, photorealistic, dramatic lighting',
        instructions: instructions || undefined,
      })
      const next = shotsWithImages.slice()
      const updated = {
        ...(next[index] || shots[index]),
        ...shots[index],
        image_b64: data.image_b64,
      }
      if (index < next.length) {
        next[index] = updated
      } else {
        while (next.length < index) next.push(null)
        next.push(updated)
      }
      set({ shotsWithImages: next })
    } catch (e) {
      set({ error: e.message })
    } finally {
      set({
        regeneratingIndices: get().regeneratingIndices.filter((i) => i !== index),
      })
    }
  },

  // ── API: audio (Google Chirp 3 HD via Cloud TTS) ─────────────────────────

  generateAudio: async () => {
    const { shots } = get()
    if (shots.length === 0) return
    set({ loading: 'audio', error: null })
    try {
      const data = await postJson('/generate-audio', { shots })
      set({ shotsWithAudio: data.shots || [] })
    } catch (e) {
      set({ error: e.message })
    } finally {
      set({ loading: null })
    }
  },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(createSafeLocalStorage),
      // Defer rehydration until after the client mounts so we never produce
      // a hydration mismatch with the server-rendered HTML.
      skipHydration: true,
      // Only persist real state; skip transient flags (loading, error,
      // regeneratingIndices) so a stale "loading" never sticks across reloads.
      partialize: (state) => ({
        messages: state.messages,
        shots: state.shots,
        scriptJson: state.scriptJson,
        shotsWithImages: state.shotsWithImages,
        shotsWithAudio: state.shotsWithAudio,
        style: state.style,
        view: state.view,
      }),
    }
  )
)

export const VIEW_LABEL = {
  script: 'Script',
  visuals: 'Visuals',
  storyboard: 'Storyboard',
  narration: 'Narration',
}
