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

export async function GET() {
  const usuarioActual = await getUsuarioActual()
  const { data, error } = await supabaseAdmin
    .from('proyectos')
    .select(`
      *,
      patrocinador:usuarios!proyectos_patrocinador_id_fkey(id,nombre,apellido),
      lineas_accion!inner(
        id, nombre, estado, fecha_inicio, fecha_fin, orden,
        responsable:usuarios!lineas_accion_responsable_id_fkey(id,nombre,apellido)
      )
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // También traer proyectos sin líneas
  let queryAll = supabaseAdmin
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

  // Si el usuario no es admin, solo ver sus proyectos asignados (donde es patrocinador)
  if (usuarioActual && !usuarioActual.is_admin) {
    queryAll = queryAll.eq('patrocinador_id', usuarioActual.id)
  }

  const { data: dataAll, error: errorAll } = await queryAll

  if (errorAll) return NextResponse.json({ error: errorAll.message }, { status: 400 })

  // Filtrar líneas eliminadas y ordenar
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
