import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('is_super_admin, nombre, apellido')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario?.is_super_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <header className="h-14 bg-[#1B2A4A] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-sm">⚙ Administración de Organizaciones</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-xs">{usuario.nombre} {usuario.apellido} · Super Admin</span>
          <a href="/login" className="text-white/40 hover:text-white text-xs transition-colors">Salir</a>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
