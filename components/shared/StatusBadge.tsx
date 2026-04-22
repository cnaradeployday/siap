import { cn } from '@/lib/utils'
import { EstadoItem, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/types'
export default function StatusBadge({ estado, size = 'sm' }: { estado: EstadoItem, size?: 'sm' | 'md' }) {
  const c = ESTADO_COLORS[estado]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-medium', c.bg, c.text,
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm')}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', c.dot)} />
      {ESTADO_LABELS[estado]}
    </span>
  )
}
