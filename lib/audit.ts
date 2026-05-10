import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function logAudit(tabla: string, accion: 'INSERT' | 'UPDATE' | 'DELETE', cambios: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let usuarioId: string | null = null
    if (user) {
      const { data } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      usuarioId = data?.id ?? null
    }

    await supabaseAdmin.from('logs_auditoria').insert({
      tabla,
      accion,
      usuario_id: usuarioId,
      cambios,
    })
  } catch {}
}
