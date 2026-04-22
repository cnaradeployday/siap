import { cn } from '@/lib/utils'
export default function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(
      'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1B2A4A] placeholder-gray-400 resize-none',
      'focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition-all',
      className
    )} {...props} />
  )
}
