'use client'

import { API_BASE } from '../utils/constants'

export function useApi(dispatch) {
  async function sendChatMessage(messages, style) {
    dispatch({ type: 'SET_LOADING', payload: 'script' })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const res = await fetch(`${API_BASE}/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, style: style || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `Request failed (${res.status})`)
      }
      const data = await res.json()

      if (data.ready && data.shots) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            role: 'assistant',
            content: `Script ready — ${data.shots.length} shots generated. Review and edit below, then click Generate Visuals.`,
          },
        })
        dispatch({ type: 'SET_SCRIPT', payload: data.shots })
      } else if (data.question) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { role: 'assistant', content: data.question },
        })
      }
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message })
    } finally {
      dispatch({ type: 'CLEAR_LOADING' })
    }
  }

  async function generateImages(shots, style) {
    dispatch({ type: 'SET_LOADING', payload: 'images' })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const res = await fetch(`${API_BASE}/generate-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots, style: style || 'cinematic, photorealistic, dramatic lighting' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `Image generation failed (${res.status})`)
      }
      const data = await res.json()
      dispatch({ type: 'SET_IMAGES', payload: data.shots })
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message })
    } finally {
      dispatch({ type: 'CLEAR_LOADING' })
    }
  }

  async function generateAudio(shots) {
    dispatch({ type: 'SET_LOADING', payload: 'audio' })
    dispatch({ type: 'CLEAR_ERROR' })
    try {
      const res = await fetch(`${API_BASE}/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(err.detail || `Audio generation failed (${res.status})`)
      }
      const data = await res.json()
      dispatch({ type: 'SET_AUDIO', payload: data.shots })
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message })
    } finally {
      dispatch({ type: 'CLEAR_LOADING' })
    }
  }

  return { sendChatMessage, generateImages, generateAudio }
}
