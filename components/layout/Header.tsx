'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Usuario } from '@/lib/types'

export default function Header({ usuario }: { usuario: Usuario }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-[#BEE3F8] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="ml-10 md:ml-0">
        <span className="text-[#1B2A4A] font-semibold text-sm hidden md:block">
          Sistema de Seguimiento de Proyectos
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[#2B6CB0] text-sm font-medium hidden md:block">
          {usuario.nombre} {usuario.apellido}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-[#1B2A4A] text-sm transition-colors p-2 rounded-lg hover:bg-[#EBF8FF]"
        >
          <LogOut size={16} />
          <span className="hidden md:block text-xs">Salir</span>
        </button>
      </div>
    </header>
  )
}
