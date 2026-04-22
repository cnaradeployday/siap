import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('roles')
    .select('*, permisos:permisos_rol(*)')
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createServiceClient()
  const { nombre, descripcion, permisos } = await req.json()
  const { data: rol, error } = await supabase
    .from('roles').insert({ nombre, descripcion }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (permisos?.length) {
    await supabase.from('permisos_rol').insert(
      permisos.map((p: any) => ({ ...p, rol_id: rol.id }))
    )
  }
  return NextResponse.json(rol)
}
