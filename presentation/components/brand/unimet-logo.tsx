import { useId } from 'react'
import { cn } from '@/presentation/lib/utils'

interface UnimetLogoProps {
  compact?: boolean
  inverted?: boolean
  className?: string
}

// UNIMET isotype: three orange bars crossed by a diagonal cut, plus the two-line wordmark.
export function UnimetIsotype({ className }: { className?: string }) {
  const maskId = useId()
  return (
    <svg viewBox="0 0 40 56" className={cn('h-10 w-auto shrink-0', className)} aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <rect width="40" height="56" fill="white" />
          <polygon points="-2,33 26,25.5 26,29.5 -2,37" fill="black" />
        </mask>
      </defs>
      <g fill="#F68629" mask={`url(#${maskId})`}>
        <rect x="0" y="0" width="10" height="56" />
        <rect x="14" y="0" width="10" height="56" />
      </g>
      <polygon points="28,24.4 38,21.7 38,56 28,56" fill="#F68629" />
    </svg>
  )
}

export function UnimetLogo({ compact = false, inverted = false, className }: UnimetLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)} aria-label="Universidad Metropolitana">
      <UnimetIsotype />
      {!compact && (
        <div className={cn('font-display leading-[0.95]', inverted ? 'text-white' : 'text-[#0b1b3d] dark:text-white')}>
          <p className="text-[1.05rem] font-normal tracking-tight">Universidad</p>
          <p className="text-[1.05rem] font-extrabold tracking-tight">Metropolitana</p>
        </div>
      )}
    </div>
  )
}
