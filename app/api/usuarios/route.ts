import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getOrgContext } from '@/lib/get-org-context'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*, rol:roles(id,nombre)')
    .eq('organizacion_id', ctx.orgId)
    .order('apellido')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { password_provisoria, ...body } = await req.json()

  if (body.email && password_provisoria) {
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: password_provisoria,
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
    body.auth_user_id = authUser.user.id
  }

  body.organizacion_id = ctx.orgId

  const { data, error } = await supabaseAdmin
    .from('usuarios').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
