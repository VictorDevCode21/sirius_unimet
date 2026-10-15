interface PageHeadingProps {
  eyebrow: string
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeading({ eyebrow, title, description, actions }: PageHeadingProps) {
  return (
    <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-title mt-2">{title}</h1>
        {description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}
