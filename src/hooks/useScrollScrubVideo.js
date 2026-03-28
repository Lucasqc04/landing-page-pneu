import { useEffect, useRef, useState } from 'react'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const IOS_SAFE_SEEK_TIME = 0.01

const isIosWebKitSafari = () => {
  if (typeof navigator === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || ''
  const isIosDevice =
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAppleWebKit =
    /AppleWebKit/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent)

  return isIosDevice && isAppleWebKit
}

function useScrollScrubVideo({ sectionRef, videoRef }) {
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const progressRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return undefined
    }

    const isIosSafari = isIosWebKitSafari()

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
    video.setAttribute('webkit-playsinline', 'true')
    video.pause()
    video.load()

    const primeFirstFrameForIos = () => {
      if (!isIosSafari) {
        return
      }

      const safeSeek = Math.min(IOS_SAFE_SEEK_TIME, video.duration || IOS_SAFE_SEEK_TIME)
      try {
        if (video.currentTime <= 0) {
          video.currentTime = safeSeek
        }
      } catch {
        // Safari iOS pode rejeitar seek em alguns estados de rede; tentamos de novo no próximo evento.
      }
    }

    video.addEventListener('loadedmetadata', syncMetadata)
    video.addEventListener('loadedmetadata', primeFirstFrameForIos)
    video.addEventListener('durationchange', syncMetadata)
    video.addEventListener('loadeddata', syncReadyState)
    video.addEventListener('loadeddata', primeFirstFrameForIos)
    video.addEventListener('canplay', syncReadyState)
    video.addEventListener('canplay', primeFirstFrameForIos)

    if (video.readyState >= 1) {
      syncMetadata()
      primeFirstFrameForIos()
    }
    syncReadyState()

    return () => {
      video.removeEventListener('loadedmetadata', syncMetadata)
      video.removeEventListener('loadedmetadata', primeFirstFrameForIos)
      video.removeEventListener('durationchange', syncMetadata)
      video.removeEventListener('loadeddata', syncReadyState)
      video.removeEventListener('loadeddata', primeFirstFrameForIos)
      video.removeEventListener('canplay', syncReadyState)
      video.removeEventListener('canplay', primeFirstFrameForIos)
    }
  }, [videoRef])

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video || duration <= 0) {
      return undefined
    }

    const isIosSafari = isIosWebKitSafari()
    const isCoarsePointer =
      window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
    const seekEpsilon = isCoarsePointer ? 1 / 12 : 1 / 120
    const minSeekIntervalMs = isCoarsePointer ? 85 : 0
    const minimumTargetTime = isIosSafari ? Math.min(IOS_SAFE_SEEK_TIME, duration) : 0

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
      const rawTargetTime = clamp(progressRef.current * duration, 0, duration)
      const targetTime =
        rawTargetTime <= 0 ? minimumTargetTime : rawTargetTime

      if (Math.abs(targetTime - lastTargetTime) > seekEpsilon) {
        lastTargetTime = targetTime
        lastSeekAt = now
        const canUseFastSeek = !isIosSafari && typeof video.fastSeek === 'function'
        try {
          if (canUseFastSeek) {
            video.fastSeek(targetTime)
          } else {
            video.currentTime = targetTime
          }
        } catch {
          // Fallback silencioso para navegadores com bug de seek (iOS Safari).
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
    window.addEventListener('pageshow', queueTick)

    return () => {
      window.removeEventListener('scroll', queueTick)
      window.removeEventListener('resize', queueTick)
      window.removeEventListener('orientationchange', queueTick)
      window.removeEventListener('pageshow', queueTick)
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
