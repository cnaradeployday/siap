import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export interface OrgContext {
  orgId: string
  isSuperAdmin: boolean
  usuarioId: string
}

export async function getOrgContext(): Promise<OrgContext | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: u } = await supabaseAdmin
    .from('usuarios')
    .select('id, organizacion_id, is_super_admin')
    .eq('auth_user_id', user.id)
    .single()

  if (!u) return null

  if (u.is_super_admin) {
    const cookieStore = await cookies()
    const activeOrgId = cookieStore.get('active_org_id')?.value
    if (!activeOrgId) return null
    return { orgId: activeOrgId, isSuperAdmin: true, usuarioId: u.id }
  }

  if (!u.organizacion_id) return null
  return { orgId: u.organizacion_id, isSuperAdmin: false, usuarioId: u.id }
}
