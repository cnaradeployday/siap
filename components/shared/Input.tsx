import { cn } from '@/lib/utils'
export default function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={cn(
      'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1B2A4A] placeholder-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition-all',
      className
    )} {...props} />
  )
}
