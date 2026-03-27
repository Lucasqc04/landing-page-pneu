import SectionLabel from './SectionLabel'

function SectionHeading({
  label,
  title,
  description,
  align = 'left',
  className = '',
}) {
  const alignmentClass = align === 'center' ? 'mx-auto text-center' : ''

  return (
    <header className={`max-w-[860px] ${alignmentClass} ${className}`}>
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      <h2 className="mt-4 font-display text-4xl leading-[1.06] tracking-[-0.03em] text-ink md:text-6xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-[62ch] text-base leading-relaxed text-steel md:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  )
}

export default SectionHeading
