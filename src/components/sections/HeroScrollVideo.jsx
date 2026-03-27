import { useRef } from 'react'
import { heroContent } from '../../content/landingContent'
import useScrollScrubVideo from '../../hooks/useScrollScrubVideo'

const HERO_SCRUB_VIEWPORTS = 3.9

function HeroScrollVideo({ videoSrc }) {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  useScrollScrubVideo({
    sectionRef,
    videoRef,
  })

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-white"
      style={{ height: `${HERO_SCRUB_VIEWPORTS * 100}svh` }}
    >
      <div className="sticky top-0 h-[92svh] overflow-hidden md:h-[90svh]">
        {/* Backgrounds */}
        <div className="absolute inset-0 bg-white" />

        {/*
          Layout row:
          · Mobile  — coluna única, texto em cima + vídeo embaixo
          · Desktop — texto (flex-1) | vídeo (~40 %) com respiro à direita
        */}
        <div className="relative z-10 flex h-full flex-col md:flex-row md:items-stretch">

          {/* ── Coluna de texto ── */}
          <div className="flex flex-1 flex-col justify-center gap-6 px-6 pt-6 pb-0
                          md:gap-7 md:px-10 md:py-12
                          lg:pl-[max(4rem,calc((100vw_-_1240px)/2_+_4rem))] lg:pr-12">
            <div className="flex items-center gap-3">
              <img
                src="/images/nsf-pneus-logo.jpeg"
                alt="Logo NSF Pneus"
                className="h-14 w-14 rounded-full border border-ink/15 bg-white object-cover p-1 md:h-16 md:w-16"
              />
              <div className="flex flex-col">
                <span className="font-display text-[0.68rem] uppercase tracking-[0.24em] text-ink/60">
                  NSF Pneus
                </span>
                <span className="font-display text-sm uppercase tracking-[0.18em] text-ink">
                  Remold
                </span>
              </div>
            </div>

            <header className="max-w-[560px]">
              <p className="font-display text-[0.72rem] uppercase tracking-[0.34em] text-ink/60">
                {heroContent.eyebrow}
              </p>
              <h1 className="mt-4 font-display text-[clamp(1.85rem,3.9vw,4.6rem)] leading-[0.93] tracking-[-0.045em] text-ink">
                {heroContent.title}
              </h1>
              <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-ink/75 md:text-lg">
                {heroContent.subtitle}
              </p>
            </header>

            <p className="max-w-[52ch] text-sm leading-relaxed text-ink/70 md:text-base">
              {heroContent.supporting}
            </p>
          </div>

          {/* ── Coluna de vídeo ──
                Mobile  : altura fixa, ocupa o restante vertical (pb-6 lateral)
                Desktop : ocupa o bloco da direita, alinhado embaixo e centralizado
          */}
          <div className="
            relative mx-6 mb-6 h-[32svh] flex-shrink-0
            md:mx-0 md:mb-0 md:h-full md:w-[42%] md:pb-12
            lg:w-[40%]
            md:flex md:items-end md:justify-center
          ">
            <div className="h-full w-full overflow-hidden rounded-[1.5rem] md:h-[72svh] md:w-[88%] md:rounded-[1.35rem]">
              <video
                ref={videoRef}
                src={videoSrc}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controlsList="nodownload noplaybackrate noremoteplayback"
                aria-label="Video do processo de fabricacao de pneus remold premium controlado pelo scroll"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default HeroScrollVideo
