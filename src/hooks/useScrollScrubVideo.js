import { useEffect, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function useScrollScrubVideo({ sectionRef, videoRef }) {
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const progressRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return undefined
    }

    const syncMetadata = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0
      if (nextDuration > 0) {
        setDuration(nextDuration)
      }
    }

    const syncReadyState = () => {
      if (video.readyState >= 2) {
        setIsReady(true)
      }
    }

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.pause()

    video.addEventListener('loadedmetadata', syncMetadata)
    video.addEventListener('durationchange', syncMetadata)
    video.addEventListener('loadeddata', syncReadyState)
    video.addEventListener('canplay', syncReadyState)

    if (video.readyState >= 1) {
      syncMetadata()
    }
    syncReadyState()

    return () => {
      video.removeEventListener('loadedmetadata', syncMetadata)
      video.removeEventListener('durationchange', syncMetadata)
      video.removeEventListener('loadeddata', syncReadyState)
      video.removeEventListener('canplay', syncReadyState)
    }
  }, [videoRef])

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video || duration <= 0) {
      return undefined
    }

    const isCoarsePointer =
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    const seekEpsilon = isCoarsePointer ? 1 / 12 : 1 / 120
    const minSeekIntervalMs = isCoarsePointer ? 85 : 0

    let rafId = null
    let isTickQueued = false
    let lastTargetTime = -1
    let lastSeekAt = 0

    const tick = (now) => {
      isTickQueued = false
      const rect = section.getBoundingClientRect()
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) {
        return
      }

      if (minSeekIntervalMs > 0 && now - lastSeekAt < minSeekIntervalMs) {
        isTickQueued = true
        rafId = requestAnimationFrame(tick)
        return
      }

      const scrubDistance = Math.max(section.offsetHeight - window.innerHeight, 1)
      const travelled = clamp(-rect.top, 0, scrubDistance)
      progressRef.current = clamp(travelled / scrubDistance, 0, 1)
      const targetTime = clamp(progressRef.current * duration, 0, duration)

      if (Math.abs(targetTime - lastTargetTime) > seekEpsilon) {
        lastTargetTime = targetTime
        lastSeekAt = now
        if (typeof video.fastSeek === 'function') {
          video.fastSeek(targetTime)
        } else {
          video.currentTime = targetTime
        }
      }
    }

    const queueTick = () => {
      if (isTickQueued) {
        return
      }
      isTickQueued = true
      rafId = requestAnimationFrame(tick)
    }

    queueTick()
    window.addEventListener('scroll', queueTick, { passive: true })
    window.addEventListener('resize', queueTick)
    window.addEventListener('orientationchange', queueTick)

    return () => {
      window.removeEventListener('scroll', queueTick)
      window.removeEventListener('resize', queueTick)
      window.removeEventListener('orientationchange', queueTick)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [duration, sectionRef, videoRef])

  return {
    duration,
    isReady,
  }
}

export default useScrollScrubVideo
