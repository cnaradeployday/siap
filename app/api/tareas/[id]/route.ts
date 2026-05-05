import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function calcFechaFin(fechaInicio: string, duracionDias: number): string {
  const d = new Date(fechaInicio + 'T12:00:00')
  d.setDate(d.getDate() + duracionDias)
  return d.toISOString().split('T')[0]
}

function nullifyEmptyUUIDs(obj: Record<string, any>) {
  const uuidFields = ['responsable_id', 'linea_id', 'created_by']
  const result = { ...obj }
  for (const f of uuidFields) {
    if (f in result && (result[f] === '' || result[f] === undefined)) result[f] = null
  }
  return result
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { dependencias, ...rawData } = body
  const tareaData = nullifyEmptyUUIDs(rawData)

  if (tareaData.fecha_inicio && tareaData.duracion_dias) {
    tareaData.fecha_fin = calcFechaFin(tareaData.fecha_inicio, Number(tareaData.duracion_dias))
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
