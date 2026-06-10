import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Organizacion } from '@/lib/types'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabaseAdmin
    .from('usuarios')
    .select('*, rol:roles(*, permisos:permisos_rol(*))')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario || !usuario.activo) redirect('/login?error=inactivo')

  // Super admin sin org activa → ir a configuración
  if (usuario.is_super_admin) {
    const cookieStore = await cookies()
    const activeOrgId = cookieStore.get('active_org_id')?.value
    if (!activeOrgId) redirect('/configuracion')
  }

  // Obtener org del usuario
  let org: Organizacion | null = null
  if (usuario.organizacion_id) {
    const { data } = await supabaseAdmin
      .from('organizaciones')
      .select('*')
      .eq('id', usuario.organizacion_id)
      .single()
    org = data
  } else if (usuario.is_super_admin) {
    const cookieStore = await cookies()
    const activeOrgId = cookieStore.get('active_org_id')?.value
    if (activeOrgId) {
      const { data } = await supabaseAdmin
        .from('organizaciones').select('*').eq('id', activeOrgId).single()
      org = data
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar usuario={usuario} org={org} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header usuario={usuario} org={org} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F0F4F8]">
          {children}
        </main>
      </div>
    </div>
  )
}
