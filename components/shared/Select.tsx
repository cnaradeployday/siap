import { cn } from '@/lib/utils'
export default function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(
      'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1B2A4A] bg-white',
      'focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition-all',
      className
    )} {...props}>
      {children}
    </select>
  )
}
