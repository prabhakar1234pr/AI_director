'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// Plays a sequence of shots whose audio is a base64-encoded MP3 (from Google
// Chirp 3 HD via the backend). Falls back to text-only stepping if a shot has
// no audio_b64 (e.g. mid-generation states).
export function useSlideshow(shotsWithAudio) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const stopAudio = useCallback(() => {
    const el = audioRef.current
    if (el) {
      try {
        el.pause()
        el.removeAttribute('src')
        el.load()
      } catch {
        /* noop */
      }
    }
  }, [])

  useEffect(() => {
    stopAudio()
    setCurrentIndex(0)
    setIsPlaying(false)
    return stopAudio
  }, [shotsWithAudio, stopAudio])

  useEffect(() => {
    if (!isPlaying) {
      stopAudio()
      return
    }
    const shot = shotsWithAudio?.[currentIndex]
    if (!shot) return

    const b64 = shot.audio_b64
    if (!b64) {
      // No audio yet — auto-advance after a short pause so the slideshow
      // doesn't hang on a half-generated state.
      const t = setTimeout(() => {
        const nextIdx = currentIndex + 1
        if (nextIdx < (shotsWithAudio?.length || 0)) setCurrentIndex(nextIdx)
        else setIsPlaying(false)
      }, 1500)
      return () => clearTimeout(t)
    }

    if (!audioRef.current) {
      audioRef.current = new Audio()
    }
    const el = audioRef.current
    el.src = `data:audio/mpeg;base64,${b64}`
    el.onended = () => {
      const nextIdx = currentIndex + 1
      if (nextIdx < shotsWithAudio.length) setCurrentIndex(nextIdx)
      else setIsPlaying(false)
    }
    el.onerror = () => {
      // Audio decode failed — skip forward instead of getting stuck.
      const nextIdx = currentIndex + 1
      if (nextIdx < shotsWithAudio.length) setCurrentIndex(nextIdx)
      else setIsPlaying(false)
    }
    el.play().catch(() => {
      setIsPlaying(false)
    })

    return () => {
      el.onended = null
      el.onerror = null
    }
  }, [currentIndex, isPlaying, shotsWithAudio, stopAudio])

  const play = useCallback(() => setIsPlaying(true), [])
  const pause = useCallback(() => {
    setIsPlaying(false)
    stopAudio()
  }, [stopAudio])

  const next = useCallback(() => {
    if (!shotsWithAudio || currentIndex >= shotsWithAudio.length - 1) return
    stopAudio()
    setIsPlaying(false)
    setCurrentIndex((i) => i + 1)
  }, [currentIndex, shotsWithAudio, stopAudio])

  const prev = useCallback(() => {
    if (currentIndex <= 0) return
    stopAudio()
    setIsPlaying(false)
    setCurrentIndex((i) => i - 1)
  }, [currentIndex, stopAudio])

  const goTo = useCallback(
    (index) => {
      stopAudio()
      setIsPlaying(false)
      setCurrentIndex(index)
    },
    [stopAudio]
  )

  return { currentIndex, isPlaying, play, pause, next, prev, goTo }
}
