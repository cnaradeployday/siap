'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ConfiguracionHeader({ nombre, apellido }: { nombre: string; apellido: string }) {
  const router = useRouter()

  async function handleSalir() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-[#1B2A4A] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="text-white font-bold text-sm">⚙ Administración de Organizaciones</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-white/60 text-xs">{nombre} {apellido} · Super Admin</span>
        <button onClick={handleSalir} className="text-white/40 hover:text-white text-xs transition-colors">
          Salir
        </button>
      </div>
    </header>
  )
}
