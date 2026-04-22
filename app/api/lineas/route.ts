import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const proyectoId = searchParams.get('proyectoId')
  let query = supabaseAdmin
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
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('lineas_accion').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
