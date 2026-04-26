'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { API_BASE } from '../utils/constants'

export const VIEWS = ['script', 'visuals', 'storyboard', 'narration', 'video']

const STORAGE_KEY = 'ai-director-store'
const STORAGE_VERSION = 3

// IndexedDB-backed storage. localStorage's ~5–10 MB quota cannot hold base64
// images / audio / Veo MP4s. IndexedDB gets us hundreds of MB to GBs per
// origin, so the full media state can survive a refresh.
function createIDBStorage() {
  if (typeof window === 'undefined') return undefined
  return {
    getItem: async (name) => {
      try {
        const value = await idbGet(name)
        return value ?? null
      } catch {
        return null
      }
    },
    setItem: async (name, value) => {
      try {
        await idbSet(name, value)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[ai-director] IndexedDB write failed:', err)
      }
    },
    removeItem: async (name) => {
      try { await idbDel(name) } catch { /* ignore */ }
    },
  }
}

const initialState = {
  messages: [],
  shots: [],
  scriptJson: '',
  shotsWithImages: [],
  shotsWithAudio: [],
  shotsWithVideos: [],
  loading: null,
  error: null,
  style: '',
  view: 'script',
  regeneratingIndices: [],
  attachedShotIndex: null,
  // Storyboard customisations.
  // storyboardOverrides: per-shot manual placement: { [index]: { top, left } }
  //   where top/left are percentages (0–100) of the panel.
  // storyboardLayoutVariants: per panel count, which preset variant index is
  //   selected: { [count]: variantIndex }.
  storyboardOverrides: {},
  storyboardLayoutVariants: {},
  // Mute the TTS narrator track. In the AI Video view this leaves the Veo
  // clip's native audio playing — only the layered Chirp 3 voiceover is
  // silenced.
  narratorMuted: false,
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

  attachShotToChat: (index) => {
    const shots = get().shots
    if (index < 0 || index >= shots.length) return
    set({ attachedShotIndex: index, view: get().view })
  },
  clearAttachedShot: () => set({ attachedShotIndex: null }),

  // Storyboard: persist a manual {top, left} (in %) for one shot's overlay box.
  setStoryboardOverride: (index, override) => {
    const next = { ...get().storyboardOverrides }
    if (override === null || override === undefined) {
      delete next[index]
    } else {
      next[index] = override
    }
    set({ storyboardOverrides: next })
  },
  clearStoryboardOverride: (index) => {
    const next = { ...get().storyboardOverrides }
    delete next[index]
    set({ storyboardOverrides: next })
  },

  // Storyboard: choose which preset layout variant to use for the current
  // shot count.
  setStoryboardLayoutVariant: (count, variantIndex) => {
    set({
      storyboardLayoutVariants: {
        ...get().storyboardLayoutVariants,
        [count]: variantIndex,
      },
    })
  },

  setNarratorMuted: (muted) => set({ narratorMuted: !!muted }),
  toggleNarratorMuted: () => set({ narratorMuted: !get().narratorMuted }),

  setScriptJsonRaw: (raw) => set({ scriptJson: raw }),
  applyValidScript: (parsed) =>
    set({
      shots: parsed,
      shotsWithImages: [],
      shotsWithAudio: [],
      shotsWithVideos: [],
    }),

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
      shotsWithVideos: [],
      storyboardOverrides: {},
    })
  },

  deleteShot: (index) => {
    const shots = get().shots.filter((_, i) => i !== index)
    // Drop the override for the removed index and shift any larger keys down.
    const overrides = get().storyboardOverrides
    const nextOverrides = {}
    for (const [k, v] of Object.entries(overrides)) {
      const i = Number(k)
      if (i < index) nextOverrides[i] = v
      else if (i > index) nextOverrides[i - 1] = v
    }
    set({
      shots,
      scriptJson: JSON.stringify(shots, null, 2),
      shotsWithImages: get().shotsWithImages.filter((_, i) => i !== index),
      shotsWithAudio: get().shotsWithAudio.filter((_, i) => i !== index),
      shotsWithVideos: get().shotsWithVideos.filter((_, i) => i !== index),
      storyboardOverrides: nextOverrides,
    })
  },

  reorderShots: (order) => {
    const { shots, shotsWithImages, shotsWithAudio, shotsWithVideos } = get()
    if (!Array.isArray(order) || order.length !== shots.length) return
    const newShots = order.map((i) => shots[i])
    const reorderedOr = (arr) =>
      arr.length === shots.length ? order.map((i) => arr[i]) : []
    // Remap overrides through `order`: new index i holds whatever was at order[i].
    const overrides = get().storyboardOverrides
    const nextOverrides = {}
    order.forEach((oldIndex, newIndex) => {
      if (overrides[oldIndex]) nextOverrides[newIndex] = overrides[oldIndex]
    })
    set({
      shots: newShots,
      scriptJson: JSON.stringify(newShots, null, 2),
      shotsWithImages: reorderedOr(shotsWithImages),
      shotsWithAudio: reorderedOr(shotsWithAudio),
      shotsWithVideos: reorderedOr(shotsWithVideos),
      storyboardOverrides: nextOverrides,
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
          shotsWithVideos: [],
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
    // Fast path: if the user explicitly attached a shot from the visuals
    // grid, skip the LLM entirely and regenerate that shot's image with the
    // user's text as the extra direction. The index is unambiguous, so we
    // don't need the model to figure it out.
    const attached = get().attachedShotIndex
    if (attached !== null) {
      const userMsg = {
        role: 'user',
        content: text,
        attachedShotIndex: attached,
      }
      set({
        messages: [...get().messages, userMsg],
        attachedShotIndex: null,
        error: null,
      })
      set({
        messages: [
          ...get().messages,
          {
            role: 'assistant',
            content: `Regenerating shot ${attached + 1} with your changes…`,
          },
        ],
      })
      await get().regenerateImage(attached, text)
      return
    }

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

  // ── API: video (Veo 3 Fast, image-to-video) ──────────────────────────────

  generateVideos: async () => {
    const { shots, shotsWithImages, style } = get()
    if (shots.length === 0) return
    set({ loading: 'video', error: null })
    try {
      const images_b64 = shots.map(
        (_, i) => shotsWithImages[i]?.image_b64 || null
      )
      const data = await postJson('/generate-videos', {
        shots,
        style: style || 'cinematic, photorealistic, dramatic lighting',
        images_b64,
      })
      set({ shotsWithVideos: data.shots || [] })
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
      storage: createJSONStorage(createIDBStorage),
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
        shotsWithVideos: state.shotsWithVideos,
        style: state.style,
        view: state.view,
        storyboardOverrides: state.storyboardOverrides,
        storyboardLayoutVariants: state.storyboardLayoutVariants,
        narratorMuted: state.narratorMuted,
      }),
    }
  )
)

export const VIEW_LABEL = {
  script: 'Script',
  visuals: 'Visuals',
  storyboard: 'Storyboard',
  narration: 'Narration',
  video: 'AI Video',
}
