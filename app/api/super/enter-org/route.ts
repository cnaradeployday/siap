import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: u } = await supabaseAdmin
    .from('usuarios').select('is_super_admin').eq('auth_user_id', user.id).single()
  if (!u?.is_super_admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { org_id } = await req.json()

  const cookieStore = await cookies()
  const response = NextResponse.json({ ok: true })

  if (org_id) {
    response.cookies.set('active_org_id', org_id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 horas
    })
  } else {
    response.cookies.delete('active_org_id')
  }

  return response
}
