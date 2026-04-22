import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('*, permisos:permisos_rol(*)')
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const { nombre, descripcion, permisos } = await req.json()
  if (!nombre) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const { data: rol, error } = await supabaseAdmin
    .from('roles').insert({ nombre, descripcion }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (permisos?.length) {
    const toInsert = permisos
      .filter((p: any) => p.puede_leer || p.puede_escribir)
      .map((p: any) => ({ ...p, rol_id: rol.id }))
    if (toInsert.length) {
      await supabaseAdmin.from('permisos_rol').insert(toInsert)
    }
  }

  const { data: rolCompleto } = await supabaseAdmin
    .from('roles').select('*, permisos:permisos_rol(*)').eq('id', rol.id).single()
  return NextResponse.json(rolCompleto)
}
