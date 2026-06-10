'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, KeyRound } from 'lucide-react'
import { Usuario, Organizacion } from '@/lib/types'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  usuario: Usuario
  org: Organizacion | null
}

export default function Header({ usuario, org }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const colorAcento = org?.color_acento ?? '#2B6CB0'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="ml-10 md:ml-0">
        <span className="text-[#1B2A4A] font-semibold text-sm hidden md:block">
          {org?.nombre ?? 'Sistema de Seguimiento de Proyectos'}
        </span>
      </div>
      <div className="flex items-center gap-3" ref={menuRef}>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colorAcento }}>
              <span className="text-white text-xs font-bold">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </span>
            </div>
            <span className="text-[#1B2A4A] text-sm font-medium hidden md:block">
              {usuario.nombre} {usuario.apellido}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs font-medium text-[#1B2A4A]">{usuario.nombre} {usuario.apellido}</p>
                <p className="text-xs text-gray-400">
                  {usuario.is_super_admin ? 'Super Admin' : usuario.is_admin ? 'Administrador' : 'Usuario'}
                </p>
              </div>
              <Link href="/perfil" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1B2A4A] transition-colors">
                <KeyRound size={14} />
                Cambiar contraseña
              </Link>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
