'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export function useSlideshow(shotsWithAudio) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const objectUrlsRef = useRef([])

  // Decode all base64 audio into object URLs when shotsWithAudio changes
  useEffect(() => {
    // Revoke previous object URLs
    objectUrlsRef.current.forEach((url) => url && URL.revokeObjectURL(url))
    objectUrlsRef.current = []
    setCurrentIndex(0)
    setIsPlaying(false)

    if (!shotsWithAudio || shotsWithAudio.length === 0) return

    const urls = shotsWithAudio.map((shot) => {
      if (!shot.audio_b64) return null
      try {
        const binary = atob(shot.audio_b64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' })
        return URL.createObjectURL(blob)
      } catch {
        return null
      }
    })

    objectUrlsRef.current = urls
  }, [shotsWithAudio])

  // Load audio for current shot
  useEffect(() => {
    const url = objectUrlsRef.current[currentIndex]
    if (!url) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.onended = null
    }

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onended = () => {
      const next = currentIndex + 1
      if (next < (shotsWithAudio?.length || 0)) {
        setCurrentIndex(next)
      } else {
        setIsPlaying(false)
      }
    }

    if (isPlaying) {
      audio.play().catch(console.error)
    }

    return () => {
      audio.pause()
      audio.onended = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, shotsWithAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => url && URL.revokeObjectURL(url))
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  const play = useCallback(() => {
    setIsPlaying(true)
    audioRef.current?.play().catch(console.error)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
    audioRef.current?.pause()
  }, [])

  const next = useCallback(() => {
    if (!shotsWithAudio) return
    if (currentIndex < shotsWithAudio.length - 1) {
      audioRef.current?.pause()
      setIsPlaying(false)
      setCurrentIndex((i) => i + 1)
    }
  }, [currentIndex, shotsWithAudio])

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      audioRef.current?.pause()
      setIsPlaying(false)
      setCurrentIndex((i) => i - 1)
    }
  }, [currentIndex])

  const goTo = useCallback(
    (index) => {
      if (!shotsWithAudio) return
      audioRef.current?.pause()
      setIsPlaying(false)
      setCurrentIndex(index)
    },
    [shotsWithAudio]
  )

  return { currentIndex, isPlaying, play, pause, next, prev, goTo }
}
