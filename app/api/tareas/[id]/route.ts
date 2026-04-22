import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createServiceClient()
  const body = await req.json()
  const { dependencias, ...tareaData } = body
  const { data, error } = await supabase
    .from('tareas').update(tareaData).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (dependencias !== undefined) {
    await supabase.from('dependencias_tareas').delete().eq('tarea_id', params.id)
    if (dependencias.length) {
      await supabase.from('dependencias_tareas').insert(
        dependencias.map((d: string) => ({ tarea_id: params.id, depende_de_id: d }))
      )
    }
  }
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('tareas').update({ deleted_at: new Date().toISOString() }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
