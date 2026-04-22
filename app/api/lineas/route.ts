import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const proyectoId = searchParams.get('proyectoId')
  let query = supabase
    .from('lineas_accion')
    .select('*, proyecto:proyectos(id,nombre,fecha_inicio,fecha_fin), responsable:usuarios!lineas_accion_responsable_id_fkey(id,nombre,apellido), patrocinador:usuarios!lineas_accion_patrocinador_id_fkey(id,nombre,apellido)')
    .is('deleted_at', null)
    .order('orden')
  if (proyectoId) query = query.eq('proyecto_id', proyectoId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('lineas_accion').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
