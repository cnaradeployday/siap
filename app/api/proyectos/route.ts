import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('proyectos')
    .select('*, patrocinador:usuarios!proyectos_patrocinador_id_fkey(id,nombre,apellido), lineas_accion(id,nombre,estado,responsable:usuarios!lineas_accion_responsable_id_fkey(id,nombre,apellido))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createServiceClient()
  const body = await req.json()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuario } = await supabase.from('usuarios').select('id').eq('auth_user_id', user!.id).single()
  const { data, error } = await supabase
    .from('proyectos')
    .insert({ ...body, created_by: usuario?.id })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
