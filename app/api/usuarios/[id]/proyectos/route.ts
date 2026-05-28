import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('usuario_proyectos')
    .select('proyecto_id')
    .eq('usuario_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json((data ?? []).map((r: any) => r.proyecto_id))
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { proyecto_ids } = await req.json() as { proyecto_ids: string[] }

  // Replace all permissions: delete then insert
  await supabaseAdmin.from('usuario_proyectos').delete().eq('usuario_id', id)

  if (proyecto_ids.length > 0) {
    const rows = proyecto_ids.map(pid => ({ usuario_id: id, proyecto_id: pid }))
    const { error } = await supabaseAdmin.from('usuario_proyectos').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
