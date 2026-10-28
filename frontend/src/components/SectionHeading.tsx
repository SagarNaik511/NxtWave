interface SectionHeadingProps {
  eyebrow: string
  title: string
  description: string
  headingId: string
}

export function SectionHeading({ eyebrow, title, description, headingId }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h2 id={headingId}>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

