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
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 ml-10 md:ml-0">
        <span className="text-[#1B2A4A] font-semibold text-sm hidden md:block">
          Sistema de Seguimiento de Proyectos
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-sm hidden md:block">
          {usuario.nombre} {usuario.apellido}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors p-2 rounded-lg hover:bg-gray-100"
        >
          <LogOut size={16} />
          <span className="hidden md:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
