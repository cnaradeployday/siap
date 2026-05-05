import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getUsuarioActual() {
  try {
    const supabase = await createUserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabaseAdmin
      .from('usuarios').select('id,is_admin').eq('auth_user_id', user.id).single()
    return data
  } catch {
    return null
  }
}

// IDs de proyectos asignados al usuario via tabla junction usuario_proyectos
async function getProyectosAsignados(usuarioId: string): Promise<string[] | null> {
  const { data, error } = await supabaseAdmin
    .from('usuario_proyectos')
    .select('proyecto_id')
    .eq('usuario_id', usuarioId)

  // Si la tabla no existe todavía (migration pendiente), devuelve null = sin filtro
  if (error) return null
  return (data ?? []).map((r: any) => r.proyecto_id)
}

export async function GET() {
  const usuarioActual = await getUsuarioActual()

  let query = supabaseAdmin
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

  // No admin: filtrar solo proyectos asignados via usuario_proyectos
  if (usuarioActual && !usuarioActual.is_admin) {
    const asignados = await getProyectosAsignados(usuarioActual.id)
    if (asignados !== null) {
      // Tabla existe: filtrar. Si no tiene proyectos asignados, devuelve lista vacía.
      if (asignados.length === 0) return NextResponse.json([])
      query = query.in('id', asignados)
    }
    // Si asignados === null (tabla no existe), muestra todo como degraded mode
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const proyectosLimpios = (data ?? []).map((p: any) => ({
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
