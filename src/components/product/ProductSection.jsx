'use client'

import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const TireViewer = lazy(() => import('./TireViewer'))

function ViewerFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[1.65rem] border border-[#d6dee8] bg-[linear-gradient(160deg,#ffffff_0%,#edf2f8_100%)]">
      <p className="text-xs uppercase tracking-[0.24em] text-ink/55">
        Preparando visualizador 3D
      </p>
    </div>
  )
}

function ProductSection() {
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [useOverlayTextures, setUseOverlayTextures] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setIsVisible(true)
        observer.disconnect()
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -8% 0px',
      },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f2f6fb_100%)] text-ink"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(148,163,184,0.16),transparent_34%),radial-gradient(circle_at_16%_78%,rgba(191,219,254,0.3),transparent_44%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-ink/8" />

      <div className="relative mx-auto grid min-h-screen max-w-[1320px] grid-cols-1 items-center gap-8 px-6 py-10 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-14 md:px-10 lg:px-16">
        <div className="order-2 max-w-[560px] md:order-1">
          <p className="font-display text-[0.7rem] uppercase tracking-[0.32em] text-steel">
            Linha premium
          </p>

          <h2 className="mt-4 text-balance font-display text-[clamp(2rem,4vw,4.5rem)] leading-[0.95] tracking-[-0.03em] text-ink">
            NSF Tire One
          </h2>

          <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-ink/75 md:text-lg">
            Pneu remold premium com acabamento técnico de fábrica, projetado para operação profissional com previsibilidade de prazo e padrão visual de novo.
          </p>

          <p className="mt-7 max-w-[52ch] text-sm leading-relaxed text-ink/65 md:text-base">
            Explore o modelo 3D em tempo real: arraste para girar, use o scroll para zoom e inspecione os detalhes do desenho e da lateral.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#contato"
              className="rounded-full bg-ink px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1a2430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8fc]"
            >
              Solicitar cotação
            </a>
            <a
              href="#especificacoes"
              className="rounded-full border border-ink/20 bg-white/70 px-7 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink transition hover:border-ink/35 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8fc]"
            >
              Ver especificações
            </a>
          </div>
        </div>

        <div
          className={`relative order-1 h-[54vh] min-h-[340px] w-full transition-all duration-900 ease-out md:order-2 md:h-[74vh] ${
            isVisible
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-6 scale-95 opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={() => setUseOverlayTextures((prev) => !prev)}
            aria-pressed={useOverlayTextures}
            className="absolute right-4 top-4 z-20 rounded-full border border-ink/15 bg-white/90 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink shadow-sm backdrop-blur transition hover:border-ink/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8fc]"
          >
            Textura extra: {useOverlayTextures ? 'ON' : 'OFF'}
          </button>

          <Suspense fallback={<ViewerFallback />}>
            <TireViewer
              modelPath="/models/tire4.glb"
              isActive={isVisible}
              useOverlayTextures={useOverlayTextures}
            />
          </Suspense>
        </div>
      </div>
    </section>
  )
}

export default ProductSection
