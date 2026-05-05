import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET: devuelve todos los proyectos con flag asignado=true/false para este usuario
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [todosRes, asignadosRes] = await Promise.all([
    supabaseAdmin
      .from('proyectos')
      .select('id, nombre, patrocinador_id, patrocinador:usuarios!proyectos_patrocinador_id_fkey(nombre,apellido)')
      .is('deleted_at', null)
      .order('nombre'),
    supabaseAdmin
      .from('usuario_proyectos')
      .select('proyecto_id')
      .eq('usuario_id', id),
  ])

  if (todosRes.error) return NextResponse.json({ error: todosRes.error.message }, { status: 400 })

  // Si la tabla junction no existe todavía, devolver proyectos sin asignaciones
  const asignadosIds = new Set(
    (asignadosRes.data ?? []).map((r: any) => r.proyecto_id)
  )

  const proyectos = (todosRes.data ?? []).map((p: any) => ({
    ...p,
    asignado: asignadosIds.has(p.id),
  }))

  return NextResponse.json(proyectos)
}

// POST: { asignar: string[], desasignar: string[] } — solo toca usuario_proyectos, NUNCA patrocinador_id
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { asignar = [], desasignar = [] } = await req.json()

  const errors: string[] = []

  if (asignar.length > 0) {
    const rows = asignar.map((proyId: string) => ({ usuario_id: id, proyecto_id: proyId }))
    const { error } = await supabaseAdmin
      .from('usuario_proyectos')
      .upsert(rows, { onConflict: 'usuario_id,proyecto_id' })
    if (error) errors.push(error.message)
  }

  if (desasignar.length > 0) {
    const { error } = await supabaseAdmin
      .from('usuario_proyectos')
      .delete()
      .eq('usuario_id', id)
      .in('proyecto_id', desasignar)
    if (error) errors.push(error.message)
  }

  if (errors.length > 0) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
  return NextResponse.json({ ok: true })
}
