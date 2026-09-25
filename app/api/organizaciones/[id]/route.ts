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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkSuperAdmin()
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (typeof body.slug === 'string' && body.slug.trim()) {
    const slug = slugify(body.slug)
    if (!slug) return NextResponse.json({ error: 'Subdominio inválido' }, { status: 400 })

    const { data: existente } = await supabaseAdmin
      .from('organizaciones').select('id').eq('slug', slug).neq('id', id).maybeSingle()
    if (existente) return NextResponse.json({ error: 'Ese subdominio ya está en uso' }, { status: 400 })

    body.slug = slug
  } else {
    delete body.slug
  }

  const { data, error } = await supabaseAdmin
    .from('organizaciones').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const ok = await checkSuperAdmin()
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { error } = await supabaseAdmin
    .from('organizaciones').update({ activo: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
