import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkSuperAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabaseAdmin
    .from('usuarios').select('is_super_admin').eq('auth_user_id', user.id).single()
  return !!data?.is_super_admin
}

export async function GET() {
  const ok = await checkSuperAdmin()
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('organizaciones')
    .select('*')
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const ok = await checkSuperAdmin()
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  const base = slugify(body.slug || body.nombre || '')
  if (!base) return NextResponse.json({ error: 'No se pudo generar el subdominio a partir del nombre' }, { status: 400 })

  const { data: existentes } = await supabaseAdmin
    .from('organizaciones')
    .select('slug')
    .like('slug', `${base}%`)

  const tomados = new Set((existentes ?? []).map(o => o.slug))
  let slug = base
  let n = 2
  while (tomados.has(slug)) {
    slug = `${base}-${n}`
    n++
  }

  const { data, error } = await supabaseAdmin
    .from('organizaciones').insert({ ...body, slug }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
