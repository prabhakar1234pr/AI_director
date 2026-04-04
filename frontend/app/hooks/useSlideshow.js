'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export function useSlideshow(shotsWithAudio) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const cancelSpeech = () => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }

  // Stop speech when audio list changes or on unmount
  useEffect(() => {
    cancelSpeech()
    setCurrentIndex(0)
    setIsPlaying(false)
    return cancelSpeech
  }, [shotsWithAudio])

  // Speak current shot when playing
  useEffect(() => {
    if (!isPlaying || !shotsWithAudio?.[currentIndex]) return

    const text = shotsWithAudio[currentIndex].audio
    if (!text) return

    cancelSpeech()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => {
      const next = currentIndex + 1
      if (next < shotsWithAudio.length) {
        setCurrentIndex(next)
      } else {
        setIsPlaying(false)
      }
    }
    window.speechSynthesis.speak(utterance)
  }, [currentIndex, isPlaying, shotsWithAudio])

  const play = useCallback(() => setIsPlaying(true), [])

  const pause = useCallback(() => {
    setIsPlaying(false)
    cancelSpeech()
  }, [])

  const next = useCallback(() => {
    if (!shotsWithAudio || currentIndex >= shotsWithAudio.length - 1) return
    cancelSpeech()
    setIsPlaying(false)
    setCurrentIndex((i) => i + 1)
  }, [currentIndex, shotsWithAudio])

  const prev = useCallback(() => {
    if (currentIndex <= 0) return
    cancelSpeech()
    setIsPlaying(false)
    setCurrentIndex((i) => i - 1)
  }, [currentIndex])

  const goTo = useCallback((index) => {
    cancelSpeech()
    setIsPlaying(false)
    setCurrentIndex(index)
  }, [])

  return { currentIndex, isPlaying, play, pause, next, prev, goTo }
}
