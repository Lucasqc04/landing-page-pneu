import { transformationPoints } from '../../content/landingContent'
import Container from '../ui/Container'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'

function TransformationTile({ label, title, copy, tone }) {
  const toneClasses =
    tone === 'after'
      ? 'border-ink/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.88),rgba(228,234,242,0.7))]'
      : 'border-ink/12 bg-[linear-gradient(145deg,rgba(250,251,253,0.94),rgba(220,226,233,0.44))]'

  return (
    <article className={`relative overflow-hidden rounded-[1.9rem] border p-8 md:p-10 ${toneClasses}`}>
      <div className="absolute right-[-3rem] top-[-3rem] h-48 w-48 rounded-full border border-white/50" />
      <p className="font-display text-[0.72rem] uppercase tracking-[0.32em] text-steel">
        {label}
      </p>
      <h3 className="mt-5 max-w-[20ch] font-display text-3xl leading-tight tracking-[-0.025em] text-ink md:text-4xl">
        {title}
      </h3>
      <p className="mt-5 max-w-[44ch] text-base leading-relaxed text-steel md:text-lg">
        {copy}
      </p>
    </article>
  )
}

function TransformationSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="absolute inset-x-0 top-0 h-px bg-line/70" />
      <Container>
        <Reveal>
          <SectionHeading
            label="Padrao NSF"
            title="Remold premium com leitura visual de pneu novo."
            description="Nao e reforma pontual de pneu do cliente: e produto de fabrica, com processo controlado e acabamento superior."
          />
        </Reveal>

        <div className="mt-14 grid gap-7 md:mt-16 md:grid-cols-2">
          {transformationPoints.map((item, index) => (
            <Reveal key={item.label} delay={index * 120}>
              <TransformationTile
                label={item.label}
                title={item.title}
                copy={item.copy}
                tone={index === 1 ? 'after' : 'before'}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

export default TransformationSection
