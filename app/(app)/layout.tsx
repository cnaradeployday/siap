import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*, rol:roles(*, permisos:permisos_rol(*))')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario || !usuario.activo) redirect('/login?error=inactivo')

  const [logoData, manualData] = await Promise.all([
    supabaseAdmin.from('configuracion').select('valor').eq('clave', 'logo_url').single(),
    supabaseAdmin.from('configuracion').select('valor').eq('clave', 'manual_url').single(),
  ])

  const logoUrl: string | null = logoData.data?.valor ?? null
  const manualUrl: string | null = manualData.data?.valor ?? null

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar usuario={usuario} logoUrl={logoUrl} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header usuario={usuario} manualUrl={manualUrl} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F0F4F8]">
          {children}
        </main>
      </div>
    </div>
  )
}
