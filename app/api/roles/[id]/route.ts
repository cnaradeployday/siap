import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createServiceClient()
  const { nombre, descripcion, permisos } = await req.json()
  if (nombre || descripcion) {
    await supabase.from('roles').update({ nombre, descripcion }).eq('id', params.id)
  }
  if (permisos) {
    for (const p of permisos) {
      await supabase.from('permisos_rol')
        .upsert({ rol_id: params.id, seccion: p.seccion, puede_leer: p.puede_leer, puede_escribir: p.puede_escribir },
          { onConflict: 'rol_id,seccion' })
    }
  }
  const { data } = await supabase.from('roles').select('*, permisos:permisos_rol(*)').eq('id', params.id).single()
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('roles').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
