import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Constantes ────────────────────────────────────────────────────────────
const TREAD_LIFETIME_MS = 1000
const TREAD_SPAWN_GAP_MS = 20
const TREAD_TRAIL_SHIFT_RATIO = 0.5
const TREAD_WIDTH_RATIO = 0.84
const TREAD_ENTRY_SHIFT_PX = 14
const IDLE_TIMEOUT_MS = 130
const MAX_TREAD_MARKS = 28

const rnd = (min, max) => Math.round(min + Math.random() * (max - min))
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const withoutId = (id) => (list) => list.filter((item) => item.id !== id)
const trimList = (list, max, cancelFn) => {
  if (list.length <= max) return list
  cancelFn(list[0].id)
  return list.slice(1)
}

// ─── Componente ────────────────────────────────────────────────────────────
function TireScrollEffect() {
  const [isMoving, setIsMoving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(() => {
    if (typeof globalThis.window === 'undefined' || typeof globalThis.document === 'undefined') {
      return 0
    }

    const maxScrollable = Math.max(globalThis.document.documentElement.scrollHeight - globalThis.window.innerHeight, 1)
    return clamp(globalThis.window.scrollY / maxScrollable, 0, 1)
  })
  const [treadMarks, setTreadMarks] = useState([])

  const lastYRef = useRef(0)
  const lastScrollAtRef = useRef(0)
  const nextTreadAtRef = useRef(0)
  const timersRef = useRef(new Map())

  const wheelSlotRef = useRef(null)
  const railRef = useRef(null)

  const isDraggingRef = useRef(false)
  const dragPointerIdRef = useRef(null)
  const dragGrabOffsetRef = useRef(0)

  const getMaxScrollable = useCallback(() => {
    const doc = globalThis.document?.documentElement
    if (!doc) return 0
    return Math.max(doc.scrollHeight - globalThis.window.innerHeight, 0)
  }, [])

  const getScrollProgress = useCallback(() => {
    const maxScrollable = Math.max(getMaxScrollable(), 1)
    return clamp(globalThis.window.scrollY / maxScrollable, 0, 1)
  }, [getMaxScrollable])

  const syncScrollProgress = useCallback(() => {
    const nextProgress = getScrollProgress()
    setScrollProgress((prev) => (Math.abs(prev - nextProgress) < 0.0005 ? prev : nextProgress))
    return nextProgress
  }, [getScrollProgress])

  const scrollToProgress = useCallback(
    (nextProgress) => {
      const clampedProgress = clamp(nextProgress, 0, 1)
      const maxScrollable = getMaxScrollable()
      globalThis.window.scrollTo({
        top: clampedProgress * maxScrollable,
        behavior: 'auto',
      })
      setScrollProgress(clampedProgress)
    },
    [getMaxScrollable],
  )

  const progressFromClientY = useCallback((clientY) => {
    const railRect = railRef.current?.getBoundingClientRect()
    const wheelRect = wheelSlotRef.current?.getBoundingClientRect()
    if (!railRect || !wheelRect) return null

    const travelHeight = Math.max(railRect.height - wheelRect.height, 1)
    const relative = clientY - railRect.top - dragGrabOffsetRef.current
    return clamp(relative / travelHeight, 0, 1)
  }, [])

  const startDrag = useCallback((pointerId) => {
    isDraggingRef.current = true
    dragPointerIdRef.current = pointerId
    setIsDragging(true)
  }, [])

  const stopDrag = useCallback((pointerId) => {
    if (!isDraggingRef.current || pointerId !== dragPointerIdRef.current) {
      return
    }

    isDraggingRef.current = false
    dragPointerIdRef.current = null
    setIsDragging(false)
    wheelSlotRef.current?.releasePointerCapture?.(pointerId)
  }, [])

  const handleRailPointerDown = (event) => {
    if (event.button !== 0) return

    event.preventDefault()
    const wheelRect = wheelSlotRef.current?.getBoundingClientRect()
    if (!wheelRect) return

    dragGrabOffsetRef.current = wheelRect.height / 2
    const nextProgress = progressFromClientY(event.clientY)
    if (nextProgress === null) return

    setIsMoving(true)
    lastScrollAtRef.current = performance.now()
    scrollToProgress(nextProgress)
    startDrag(event.pointerId)
  }

  const handleWheelPointerDown = (event) => {
    if (event.button !== 0) return

    event.preventDefault()
    const wheelRect = wheelSlotRef.current?.getBoundingClientRect()
    if (!wheelRect) return

    dragGrabOffsetRef.current = clamp(event.clientY - wheelRect.top, 0, wheelRect.height)
    setIsMoving(true)
    lastScrollAtRef.current = performance.now()
    wheelSlotRef.current?.setPointerCapture?.(event.pointerId)
    startDrag(event.pointerId)
  }

  useEffect(() => {
    const timers = timersRef.current
    lastYRef.current = globalThis.window.scrollY
    lastScrollAtRef.current = performance.now()

    let rafId

    const getWheelMetrics = () => {
      const rect = wheelSlotRef.current?.getBoundingClientRect()
      if (!rect) return null
      return {
        left: rect.left,
        centerY: rect.top + rect.height / 2,
        width: rect.width,
        size: rect.height || rect.width,
      }
    }

    const cancel = (id) => {
      const tid = timers.get(id)
      if (tid) {
        clearTimeout(tid)
        timers.delete(id)
      }
    }

    const scheduleRemove = (id, setter, delay) => {
      const tid = setTimeout(() => {
        setter(withoutId(id))
        timers.delete(id)
      }, delay)
      timers.set(id, tid)
    }

    // ── marca de rastro no chão ──────────────────────────────────────────
    const makeTreadMark = (id, direction, metrics) => {
      const trailDirection = direction === 'down' ? -1 : 1
      const treadWidth = metrics.width * TREAD_WIDTH_RATIO
      return {
        id,
        top: metrics.centerY + trailDirection * metrics.size * TREAD_TRAIL_SHIFT_RATIO + rnd(-7, 7),
        left: metrics.left + (metrics.width - treadWidth) / 2,
        width: treadWidth,
        scale: 0.86 + Math.random() * 0.1,
        rotate: rnd(-2, 2),
        entryShift: trailDirection * -TREAD_ENTRY_SHIFT_PX + rnd(-2, 2),
      }
    }

    const spawnTreadMark = (direction, now) => {
      const metrics = getWheelMetrics()
      if (!metrics) return

      const id = `tr-${now}-${Math.random().toString(36).slice(2, 7)}`
      scheduleRemove(id, setTreadMarks, TREAD_LIFETIME_MS)
      setTreadMarks((prev) => trimList([...prev, makeTreadMark(id, direction, metrics)], MAX_TREAD_MARKS, cancel))
    }

    // ── scroll handler ───────────────────────────────────────────────────
    const handleScroll = () => {
      const now = performance.now()
      const y = globalThis.window.scrollY
      const dy = y - lastYRef.current
      lastYRef.current = y
      syncScrollProgress()

      if (Math.abs(dy) < 0.5) return

      setIsMoving(true)
      lastScrollAtRef.current = now

      if (now >= nextTreadAtRef.current) {
        spawnTreadMark(dy > 0 ? 'down' : 'up', now)
        nextTreadAtRef.current = now + TREAD_SPAWN_GAP_MS
      }
    }

    const handleResize = () => {
      syncScrollProgress()
    }

    const handlePointerMove = (event) => {
      if (!isDraggingRef.current || event.pointerId !== dragPointerIdRef.current) {
        return
      }

      const nextProgress = progressFromClientY(event.clientY)
      if (nextProgress === null) return

      setIsMoving(true)
      lastScrollAtRef.current = performance.now()
      scrollToProgress(nextProgress)
    }

    const handlePointerUp = (event) => {
      stopDrag(event.pointerId)
    }

    // ── idle watcher ─────────────────────────────────────────────────────
    const tick = () => {
      if (!isDraggingRef.current && performance.now() - lastScrollAtRef.current > IDLE_TIMEOUT_MS) {
        setIsMoving(false)
      }
      rafId = requestAnimationFrame(tick)
    }

    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })
    globalThis.window.addEventListener('resize', handleResize)
    globalThis.window.addEventListener('pointermove', handlePointerMove)
    globalThis.window.addEventListener('pointerup', handlePointerUp)
    globalThis.window.addEventListener('pointercancel', handlePointerUp)
    rafId = requestAnimationFrame(tick)

    return () => {
      globalThis.window.removeEventListener('scroll', handleScroll)
      globalThis.window.removeEventListener('resize', handleResize)
      globalThis.window.removeEventListener('pointermove', handlePointerMove)
      globalThis.window.removeEventListener('pointerup', handlePointerUp)
      globalThis.window.removeEventListener('pointercancel', handlePointerUp)
      cancelAnimationFrame(rafId)
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [progressFromClientY, scrollToProgress, stopDrag, syncScrollProgress])

  return (
    <>
      {/* 1 ── Marcas ancoradas na página */}
      <div className="tire-tread-marks-layer is-visible" aria-hidden="true">
        {treadMarks.map((mark) => (
          <span
            key={mark.id}
            className="tire-tread-stamp"
            style={{
              '--stamp-top': `${mark.top}px`,
              '--stamp-left': `${mark.left}px`,
              '--stamp-width': `${mark.width}px`,
              '--stamp-scale': mark.scale,
              '--stamp-rotate': `${mark.rotate}deg`,
              '--stamp-entry-shift': `${mark.entryShift}px`,
            }}
          >
            <img
              src="/patterns/tread-track-a.png"
              alt=""
              draggable="false"
              decoding="async"
            />
          </span>
        ))}
      </div>

      <div className="tire-scroll-overlay">
        <div
          ref={railRef}
          className="tire-scroll-rail is-visible"
          onPointerDown={handleRailPointerDown}
          aria-label="Barra de rolagem personalizada"
          role="scrollbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(scrollProgress * 100)}
          tabIndex={-1}
        />

        {/* 2 ── Pneu (thumb) */}
        <div
          ref={wheelSlotRef}
          className={`tire-scroll-wheel-slot is-visible${isDragging ? ' is-dragging' : ''}`}
          style={{ '--wheel-progress': scrollProgress }}
          onPointerDown={handleWheelPointerDown}
        >
          <div className="tire-scroll-wheel-shell is-visible">
            <img
              src="/images/scroll-tire.png"
              alt=""
              className={`tire-scroll-wheel${isMoving ? ' is-moving' : ''}`}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default TireScrollEffect
