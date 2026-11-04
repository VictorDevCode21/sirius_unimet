import { CircleAlert } from 'lucide-react'
import type { Occupancy } from '@/domain/sections/occupancy'

// Seats bar with the enrolled/capacity ratio; a full section is marked with icon and text, not only color.
export function OccupancyBar({ occupancy }: { occupancy: Occupancy }) {
  return (
    <div className="flex min-w-[7rem] flex-col gap-1">
      <div className={`progress-track ${occupancy.full ? 'orange' : ''}`} aria-hidden="true">
        <span style={{ width: `${occupancy.percent}%` }} />
      </div>
      {occupancy.full ? (
        <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-[var(--status-available)]">
          <CircleAlert className="h-3 w-3" aria-hidden="true" /> Sin cupos
        </span>
      ) : (
        <span className="text-[0.68rem] text-muted-foreground">{occupancy.percent}% ocupado</span>
      )}
    </div>
  )
}
