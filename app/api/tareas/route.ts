import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const lineaId = searchParams.get('lineaId')
  let query = supabase
    .from('tareas')
    .select('*, responsable:usuarios!tareas_responsable_id_fkey(id,nombre,apellido), linea:lineas_accion(id,nombre,proyecto_id), subtareas(*, responsable:usuarios!subtareas_responsable_id_fkey(id,nombre,apellido)), dependencias:dependencias_tareas(*, depende_de:tareas!dependencias_tareas_depende_de_id_fkey(id,nombre))')
    .is('deleted_at', null)
    .order('orden')
  if (lineaId) query = query.eq('linea_id', lineaId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createServiceClient()
  const body = await req.json()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('id').eq('auth_user_id', user!.id).single()
  const { dependencias, ...tareaData } = body
  const { data, error } = await supabase
    .from('tareas').insert({ ...tareaData, created_by: usuario?.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (dependencias?.length) {
    await supabase.from('dependencias_tareas').insert(
      dependencias.map((d: string) => ({ tarea_id: data.id, depende_de_id: d }))
    )
  }
  return NextResponse.json(data)
}
