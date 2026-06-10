import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getOrgContext } from '@/lib/get-org-context'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: dataAll, error: errorAll } = await supabaseAdmin
    .from('proyectos')
    .select(`
      *,
      patrocinador:usuarios!proyectos_patrocinador_id_fkey(id,nombre,apellido),
      lineas_accion(
        id, nombre, estado, fecha_inicio, fecha_fin, orden, deleted_at,
        responsable:usuarios!lineas_accion_responsable_id_fkey(id,nombre,apellido)
      )
    `)
    .eq('organizacion_id', ctx.orgId)
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
  const ctx = await getOrgContext()
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  body.organizacion_id = ctx.orgId

  const { data, error } = await supabaseAdmin
    .from('proyectos').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
