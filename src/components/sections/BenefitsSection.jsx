import { benefits } from '../../content/landingContent'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'

function BenefitsSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="absolute left-1/2 top-[26%] -z-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(197,207,219,0.5)_0%,rgba(244,245,247,0)_70%)]" />
      <Container>
        <Reveal>
          <SectionHeading
            label="Beneficios"
            title="Pneus remold premium para compra profissional."
            description="A NSF fabrica e vende remold com acabamento superior, padrao tecnico consistente e visual de alto nivel."
          />
        </Reveal>

        <div className="mt-14 grid gap-7 md:mt-16 md:grid-cols-2">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delay={index * 90}>
              <article className="border-t border-line pt-6 md:pt-7">
                <h3 className="font-display text-[1.6rem] leading-tight tracking-[-0.02em] text-ink md:text-[2rem]">
                  {benefit.title}
                </h3>
                <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-steel md:text-lg">
                  {benefit.copy}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default BenefitsSection
