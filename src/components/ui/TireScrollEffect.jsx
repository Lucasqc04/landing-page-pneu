import { useEffect, useRef, useState } from 'react'

// ─── Constantes ────────────────────────────────────────────────────────────
const TREAD_LIFETIME_MS = 1000
const TREAD_SPAWN_GAP_MS = 20
const TREAD_TRAIL_SHIFT_RATIO = 0.5
const TREAD_WIDTH_RATIO = 0.84
const TREAD_ENTRY_SHIFT_PX = 14
const IDLE_TIMEOUT_MS = 130
const HERO_SCROLL_SECTION_SELECTOR = '[data-hero-scroll-section]'
const MAX_TREAD_MARKS = 28

const rnd = (min, max) => Math.round(min + Math.random() * (max - min))
const getPageHeight = () => {
  const doc = globalThis.document
  if (!doc) return 0
  return Math.max(
    globalThis.window?.innerHeight ?? 0,
    doc.documentElement?.scrollHeight ?? 0,
    doc.body?.scrollHeight ?? 0,
  )
}
const withoutId = (id) => (list) => list.filter((item) => item.id !== id)
const trimList = (list, max, cancelFn) => {
  if (list.length <= max) return list
  cancelFn(list[0].id)
  return list.slice(1)
}

// ─── Componente ────────────────────────────────────────────────────────────
function TireScrollEffect() {
  const [isMoving, setIsMoving] = useState(false)
  const [isAfterHero, setIsAfterHero] = useState(false)
  const [treadMarks, setTreadMarks] = useState([])
  const [pageHeight, setPageHeight] = useState(() => getPageHeight())

  const lastYRef = useRef(0)
  const lastScrollAtRef = useRef(0)
  const nextTreadAtRef = useRef(0)
  const timersRef = useRef(new Map())
  const wheelSlotRef = useRef(null)
  const heroSectionRef = useRef(null)

  useEffect(() => {
    const timers = timersRef.current
    lastYRef.current = globalThis.window.scrollY
    lastScrollAtRef.current = performance.now()

    let rafId

    const syncPageHeight = () => {
      const nextHeight = getPageHeight()
      setPageHeight((prev) => (prev === nextHeight ? prev : nextHeight))
    }

    const getWheelMetrics = () => {
      const rect = wheelSlotRef.current?.getBoundingClientRect()
      if (!rect) return null
      return {
        left: globalThis.window.scrollX + rect.left,
        centerY: globalThis.window.scrollY + rect.top + rect.height / 2,
        width: rect.width,
        size: rect.height || rect.width,
      }
    }

    const getHeroSection = () => {
      if (heroSectionRef.current?.isConnected) {
        return heroSectionRef.current
      }

      heroSectionRef.current = globalThis.document?.querySelector(HERO_SCROLL_SECTION_SELECTOR) ?? null
      return heroSectionRef.current
    }

    const syncHeroVisibility = () => {
      const heroSection = getHeroSection()
      if (!heroSection) {
        setIsAfterHero(true)
        return true
      }

      const nextIsAfterHero = heroSection.getBoundingClientRect().bottom <= globalThis.window.innerHeight
      setIsAfterHero((prev) => (prev === nextIsAfterHero ? prev : nextIsAfterHero))
      return nextIsAfterHero
    }

    const cancel = (id) => {
      const tid = timers.get(id)
      if (tid) { clearTimeout(tid); timers.delete(id) }
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
      syncPageHeight()

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

      if (!syncHeroVisibility()) {
        setIsMoving(false)
        return
      }

      if (Math.abs(dy) < 0.5) return

      setIsMoving(true)
      lastScrollAtRef.current = now

      if (now >= nextTreadAtRef.current) {
        spawnTreadMark(dy > 0 ? 'down' : 'up', now)
        nextTreadAtRef.current = now + TREAD_SPAWN_GAP_MS
      }
    }

    // ── idle watcher ─────────────────────────────────────────────────────
    const tick = () => {
      if (performance.now() - lastScrollAtRef.current > IDLE_TIMEOUT_MS) {
        setIsMoving(false)
      }
      rafId = requestAnimationFrame(tick)
    }

    syncHeroVisibility()
    syncPageHeight()
    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })
    globalThis.window.addEventListener('resize', syncPageHeight)
    globalThis.window.addEventListener('resize', syncHeroVisibility)
    rafId = requestAnimationFrame(tick)

    return () => {
      globalThis.window.removeEventListener('scroll', handleScroll)
      globalThis.window.removeEventListener('resize', syncPageHeight)
      globalThis.window.removeEventListener('resize', syncHeroVisibility)
      cancelAnimationFrame(rafId)
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  if (!isAfterHero) {
    return null
  }

  return (
    <>
      {/* 1 ── Marcas ancoradas na página */}
      <div
        className="tire-tread-marks-layer"
        aria-hidden="true"
        style={{ '--tread-page-height': `${pageHeight}px` }}
      >
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

      <div className="tire-scroll-overlay" aria-hidden="true">
        {/* 2 ── Pneu (topo) */}
        <div className="tire-scroll-wheel-slot" ref={wheelSlotRef}>
          <img
            src="/images/scroll-tire.png"
            alt=""
            className={`tire-scroll-wheel${isMoving ? ' is-moving' : ''}`}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </>
  )
}

export default TireScrollEffect
