import { ctaContent } from '../../content/landingContent'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'

function FinalCtaSection() {
  return (
    <section className="relative py-20 md:py-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.2rem] border border-white/70 bg-[linear-gradient(160deg,#0e1622_0%,#1c2836_48%,#2f3b4a_100%)] px-7 py-12 md:px-14 md:py-16">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(156,176,198,0.45),transparent_44%),radial-gradient(circle_at_78%_84%,rgba(91,124,153,0.34),transparent_42%)]" />

            <div className="relative z-10 max-w-[820px]">
              <p className="font-display text-[0.72rem] uppercase tracking-[0.32em] text-[#b6c4d5]">
                Chamada final
              </p>
              <h2 className="mt-4 font-display text-4xl leading-[1.04] tracking-[-0.03em] text-white md:text-6xl">
                {ctaContent.title}
              </h2>
              <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#c7d2de] md:text-lg">
                {ctaContent.subtitle}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#"
                  className="rounded-full bg-white px-7 py-3 text-sm font-semibold uppercase tracking-[0.13em] text-[#0d1623] transition hover:bg-[#dfe8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d1623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#dfe8f2]"
                >
                  Pedir cotação
                </a>
                <a
                  href="#"
                  className="rounded-full border border-white/45 px-7 py-3 text-sm font-semibold uppercase tracking-[0.13em] text-white transition hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e1622]"
                >
                  Falar com comercial
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}

export default FinalCtaSection
