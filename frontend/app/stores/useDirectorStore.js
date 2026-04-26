'use client'

import { create } from 'zustand'
import { API_BASE } from '../utils/constants'

const PAGE_BY_STEP = {
  1: 'script',
  2: 'visuals',
  3: 'storyboard',
  4: 'narration',
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
  step: 1,
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

export const useDirectorStore = create((set, get) => ({
  ...initialState,

  // ── Computed ─────────────────────────────────────────────────────────────

  page: () => PAGE_BY_STEP[get().step] || 'script',
  maxStep: () => {
    const s = get()
    if (s.shots.length === 0) return 1
    if (s.shotsWithImages.length === 0) return 2
    return 4
  },

  // ── Pure setters ─────────────────────────────────────────────────────────

  setStep: (step) => set({ step }),
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
      page: PAGE_BY_STEP[s.step] || 'script',
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

  // ── API: audio (browser TTS) ─────────────────────────────────────────────

  generateAudio: async () => {
    const { shots } = get()
    set({ loading: 'audio', error: null })
    set({ shotsWithAudio: shots })
    set({ loading: null })
  },
}))

export { PAGE_BY_STEP }
