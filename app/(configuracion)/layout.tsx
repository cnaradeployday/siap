import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ConfiguracionHeader from './ConfiguracionHeader'

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
      <ConfiguracionHeader nombre={usuario.nombre} apellido={usuario.apellido} />
      <main className="p-6">{children}</main>
    </div>
  )
}
