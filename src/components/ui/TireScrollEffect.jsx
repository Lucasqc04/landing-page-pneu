import { useEffect, useRef, useState } from 'react'

// ─── Constantes ────────────────────────────────────────────────────────────
const SMOKE_LIFETIME_MS = 2600
const SMOKE_SPAWN_GAP_MS = 60
const TREAD_LIFETIME_MS = 3000
const TREAD_SPAWN_GAP_MS = 380
const TREAD_TRAIL_SHIFT_PERCENT = 90
const TREAD_TRAIL_SHIFT_UP_WHEN_SCROLL_DOWN = -TREAD_TRAIL_SHIFT_PERCENT
const TREAD_TRAIL_SHIFT_DOWN_WHEN_SCROLL_UP = TREAD_TRAIL_SHIFT_PERCENT
const IDLE_TIMEOUT_MS = 130
const MAX_SMOKES = 48
const MAX_TREAD_MARKS = 10

const rnd = (min, max) => Math.round(min + Math.random() * (max - min))
const withoutId = (id) => (list) => list.filter((item) => item.id !== id)
const trimList = (list, max, cancelFn) => {
  if (list.length <= max) return list
  cancelFn(list[0].id)
  return list.slice(1)
}

// ─── Componente ────────────────────────────────────────────────────────────
function TireScrollEffect() {
  const [isMoving, setIsMoving] = useState(false)
  const [smokes, setSmokes] = useState([])
  const [treadMarks, setTreadMarks] = useState([])

  const lastYRef = useRef(0)
  const lastScrollAtRef = useRef(0)
  const nextSmokeAtRef = useRef(0)
  const nextTreadAtRef = useRef(0)
  const timersRef = useRef(new Map())

  useEffect(() => {
    const timers = timersRef.current
    lastYRef.current = globalThis.window.scrollY
    lastScrollAtRef.current = performance.now()

    let rafId

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

    // ── fumaça ──────────────────────────────────────────────────────────
    const makeSmoke = (direction, id) => ({
      id,
      direction,
      spawnX: rnd(-7, 9),
      spawnY: rnd(-18, 18),
      swayX: rnd(-6, 7),
      travel: rnd(120, 220),
      width: rnd(34, 50),
      height: rnd(110, 180),
      tilt: rnd(-5, 5),
    })

    const spawnSmoke = (direction, now) => {
      const id = `sm-${now}-${Math.random().toString(36).slice(2, 7)}`
      scheduleRemove(id, setSmokes, SMOKE_LIFETIME_MS)
      setSmokes((prev) => trimList([...prev, makeSmoke(direction, id)], MAX_SMOKES, cancel))
    }

    // ── marca de rastro no chão ──────────────────────────────────────────
    const makeTreadMark = (id, direction) => ({
      id,
      offsetY: rnd(-10, 10),
      scale: 0.9 + Math.random() * 0.2,
      rotate: rnd(-3, 3),
      trailY:
        (
          direction === 'down'
            ? TREAD_TRAIL_SHIFT_UP_WHEN_SCROLL_DOWN
            : TREAD_TRAIL_SHIFT_DOWN_WHEN_SCROLL_UP
        ) +
        rnd(-3, 3),
    })

    const spawnTreadMark = (direction, now) => {
      const id = `tr-${now}-${Math.random().toString(36).slice(2, 7)}`
      scheduleRemove(id, setTreadMarks, TREAD_LIFETIME_MS)
      setTreadMarks((prev) => trimList([...prev, makeTreadMark(id, direction)], MAX_TREAD_MARKS, cancel))
    }

    // ── scroll handler ───────────────────────────────────────────────────
    const handleScroll = () => {
      const now = performance.now()
      const y = globalThis.window.scrollY
      const dy = y - lastYRef.current
      lastYRef.current = y

      if (Math.abs(dy) < 0.5) return

      setIsMoving(true)
      lastScrollAtRef.current = now

      if (now >= nextSmokeAtRef.current) {
        spawnSmoke(dy > 0 ? 'down' : 'up', now)
        nextSmokeAtRef.current = now + SMOKE_SPAWN_GAP_MS
      }

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

    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })
    rafId = requestAnimationFrame(tick)

    return () => {
      globalThis.window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  return (
    <div className="tire-scroll-overlay" aria-hidden="true">

      {/* 1 ── Marcas de rastro no chão (z-index 0 — abaixo de tudo) */}
      <div className="tire-tread-marks-layer">
        {treadMarks.map((mark) => (
          <span
            key={mark.id}
            className="tire-tread-stamp"
            style={{
              '--stamp-offset-y': `${mark.offsetY}px`,
              '--stamp-trail-y': `${mark.trailY}%`,
              '--stamp-scale': mark.scale,
              '--stamp-rotate': `${mark.rotate}deg`,
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

      {/* 2 ── Fumaça (z-index 1) */}
      <div className="tire-scroll-smoke-layer">
        {smokes.map((smoke) => (
          <span
            key={smoke.id}
            className={`tire-scroll-smoke tire-scroll-smoke-${smoke.direction}`}
            style={{
              '--smoke-spawn-x': `${smoke.spawnX}px`,
              '--smoke-spawn-y': `${smoke.spawnY}px`,
              '--smoke-sway-x': `${smoke.swayX}px`,
              '--smoke-travel': `${smoke.travel}px`,
              '--smoke-width': `${smoke.width}px`,
              '--smoke-height': `${smoke.height}px`,
              '--smoke-tilt': `${smoke.tilt}deg`,
              '--smoke-opacity': '0.42',
              '--smoke-opacity-mid': '0.30',
            }}
          >
            <img
              src="/patterns/tread-track-a.png"
              alt=""
              className="tire-scroll-smoke-image"
              decoding="async"
            />
          </span>
        ))}
      </div>

      {/* 3 ── Pneu (z-index 2 — topo) */}
      <div className="tire-scroll-wheel-slot">
        <img
          src="/images/scroll-tire.png"
          alt=""
          className={`tire-scroll-wheel${isMoving ? ' is-moving' : ''}`}
          loading="eager"
          decoding="async"
        />
      </div>

    </div>
  )
}

export default TireScrollEffect
