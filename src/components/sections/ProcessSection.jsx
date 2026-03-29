import { processSteps } from '../../content/landingContent'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'

function ProcessSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="pointer-events-none absolute left-[-1rem] top-14 h-[13rem] w-[4rem] rotate-[7deg] tread-watermark tread-watermark-b tread-watermark-soft md:left-[-2rem] md:top-20 md:h-[25rem] md:w-[7.5rem]" />
      <div className="pointer-events-none absolute right-[-1.2rem] bottom-16 hidden h-[27rem] w-[8rem] -rotate-[11deg] tread-watermark tread-watermark-a tread-watermark-soft md:block" />
      <Container>
        <Reveal>
          <SectionHeading
            label="Processo"
            title="Processo industrial com controle técnico ponta a ponta."
            description="Da seleção da carcaça ao acabamento final, cada etapa segue padrão de fábrica para entregar remold premium consistente."
          />
        </Reveal>

        <ol className="mt-14 border-t border-line/90 md:mt-16">
          {processSteps.map((step, index) => (
            <Reveal key={step.step} delay={index * 100}>
              <li className="grid gap-4 border-b border-line/70 py-10 md:grid-cols-[88px_1fr_210px] md:items-center md:gap-8">
                <span className="font-display text-sm tracking-[0.2em] text-steel">
                  {step.step}
                </span>
                <div>
                  <h3 className="font-display text-[1.65rem] leading-tight tracking-[-0.02em] text-ink md:text-[2.1rem]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-steel md:text-lg">
                    {step.description}
                  </p>
                </div>
                <p className="font-display text-sm uppercase tracking-[0.16em] text-ink/80 md:text-right">
                  {step.highlight}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}

export default ProcessSection
