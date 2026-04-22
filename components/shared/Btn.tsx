import { cn } from '@/lib/utils'
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  loading?: boolean
}
export default function Btn({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: Props) {
  const variants = {
    primary: 'bg-[#1B2A4A] hover:bg-[#2B4A7A] text-white',
    secondary: 'bg-[#EBF8FF] hover:bg-[#BEE3F8] text-[#1B2A4A] border border-[#BEE3F8]',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
    ghost: 'hover:bg-gray-100 text-gray-600',
  }
  return (
    <button disabled={disabled || loading} className={cn(
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed',
      variants[variant],
      size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
      className
    )} {...props}>
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  )
}
