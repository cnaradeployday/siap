import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { nombre, descripcion, permisos } = await req.json()
  if (nombre || descripcion) {
    await supabaseAdmin.from('roles').update({ nombre, descripcion }).eq('id', id)
  }
  if (permisos) {
    for (const p of permisos) {
      await supabaseAdmin.from('permisos_rol')
        .upsert({ rol_id: id, seccion: p.seccion, puede_leer: p.puede_leer, puede_escribir: p.puede_escribir },
          { onConflict: 'rol_id,seccion' })
    }
  }
  const { data } = await supabaseAdmin.from('roles').select('*, permisos:permisos_rol(*)').eq('id', id).single()
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin.from('roles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
