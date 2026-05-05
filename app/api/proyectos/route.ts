import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const { data: dataAll, error: errorAll } = await supabaseAdmin
    .from('proyectos')
    .select(`
      *,
      patrocinador:usuarios!proyectos_patrocinador_id_fkey(id,nombre,apellido),
      lineas_accion(
        id, nombre, estado, fecha_inicio, fecha_fin, orden,
        responsable:usuarios!lineas_accion_responsable_id_fkey(id,nombre,apellido)
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (errorAll) return NextResponse.json({ error: errorAll.message }, { status: 400 })

  const proyectosLimpios = (dataAll ?? []).map((p: any) => ({
    ...p,
    lineas_accion: [...(p.lineas_accion ?? [])]
      .filter((l: any) => !l.deleted_at)
      .sort((a: any, b: any) => a.orden - b.orden)
  }))

  return NextResponse.json(proyectosLimpios)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('proyectos').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
