import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { dependencias, ...tareaData } = body

  if (tareaData.fecha_inicio && tareaData.duracion_dias) {
    const inicio = new Date(tareaData.fecha_inicio + 'T12:00:00')
    inicio.setDate(inicio.getDate() + Number(tareaData.duracion_dias) - 1)
    tareaData.fecha_fin = inicio.toISOString().split('T')[0]
  }

  const { data, error } = await supabaseAdmin
    .from('tareas').update(tareaData).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (dependencias !== undefined) {
    await supabaseAdmin.from('dependencias_tareas').delete().eq('tarea_id', id)
    if (dependencias.length) {
      await supabaseAdmin.from('dependencias_tareas').insert(
        dependencias.map((d: string) => ({ tarea_id: id, depende_de_id: d }))
      )
    }
  }
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabaseAdmin
    .from('tareas').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
