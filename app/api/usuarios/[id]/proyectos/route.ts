import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET: devuelve todos los proyectos indicando cuáles están asignados al usuario
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('proyectos')
    .select('id, nombre, patrocinador_id')
    .is('deleted_at', null)
    .order('nombre')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}

// POST: recibe { asignar: string[], desasignar: string[] } y actualiza patrocinador_id
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { asignar = [], desasignar = [] } = await req.json()

  const errors: string[] = []

  if (asignar.length > 0) {
    const { error } = await supabaseAdmin
      .from('proyectos')
      .update({ patrocinador_id: id })
      .in('id', asignar)
    if (error) errors.push(error.message)
  }

  if (desasignar.length > 0) {
    // Solo desasignar si actualmente este usuario es el patrocinador
    const { error } = await supabaseAdmin
      .from('proyectos')
      .update({ patrocinador_id: null })
      .in('id', desasignar)
      .eq('patrocinador_id', id)
    if (error) errors.push(error.message)
  }

  if (errors.length > 0) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
  return NextResponse.json({ ok: true })
}
