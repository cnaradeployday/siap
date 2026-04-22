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

  if (!nombre) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const { data: rol, error } = await supabase
    .from('roles').insert({ nombre, descripcion }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (permisos?.length) {
    const permisosAInsertar = permisos
      .filter((p: any) => p.puede_leer || p.puede_escribir)
      .map((p: any) => ({ ...p, rol_id: rol.id }))
    
    if (permisosAInsertar.length) {
      const { error: permError } = await supabase
        .from('permisos_rol').insert(permisosAInsertar)
      if (permError) return NextResponse.json({ error: permError.message }, { status: 400 })
    }
  }

  const { data: rolCompleto } = await supabase
    .from('roles').select('*, permisos:permisos_rol(*)').eq('id', rol.id).single()
  return NextResponse.json(rolCompleto)
}
