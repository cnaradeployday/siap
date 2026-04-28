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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lineaId = searchParams.get('lineaId')

  let query = supabaseAdmin
    .from('tareas')
    .select(`
      *,
      responsable:usuarios!tareas_responsable_id_fkey(id,nombre,apellido),
      linea:lineas_accion(
        id, nombre, orden,
        proyecto:proyectos(id,nombre)
      ),
      subtareas(
        *,
        responsable:usuarios!subtareas_responsable_id_fkey(id,nombre,apellido)
      ),
      dependencias:dependencias_tareas!dependencias_tareas_tarea_id_fkey(
        id,
        depende_de_id,
        depende_de:tareas!dependencias_tareas_depende_de_id_fkey(id,nombre)
      )
    `)
    .is('deleted_at', null)
    .order('orden')

  if (lineaId) query = query.eq('linea_id', lineaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const body = await req.json()
  const { dependencias, proyecto_id, ...tareaData } = body

  // Validar máximo 3 tareas por línea de acción
  if (tareaData.linea_id) {
    const { count } = await supabaseAdmin
      .from('tareas')
      .select('id', { count: 'exact', head: true })
      .eq('linea_id', tareaData.linea_id)
      .is('deleted_at', null)
    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Una línea de acción no puede tener más de 3 tareas.' }, { status: 400 })
    }
  }

  if (tareaData.fecha_inicio && tareaData.duracion_dias) {
    tareaData.fecha_fin = calcFechaFin(tareaData.fecha_inicio, Number(tareaData.duracion_dias))
  }

  const { data, error } = await supabaseAdmin
    .from('tareas').insert(tareaData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (dependencias?.length) {
    await supabaseAdmin.from('dependencias_tareas').insert(
      dependencias.map((d: string) => ({ tarea_id: data.id, depende_de_id: d }))
    )
  }
  return NextResponse.json(data)
}
