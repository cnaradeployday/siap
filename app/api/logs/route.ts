import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tabla = searchParams.get('tabla')
  const accion = searchParams.get('accion')
  const page = Number(searchParams.get('page') ?? '1')
  const limit = 50
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('logs_auditoria')
    .select('*, usuario:usuarios(id,nombre,apellido)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tabla) query = query.eq('tabla', tabla)
  if (accion) query = query.eq('accion', accion)

  const { data, error, count } = await query
  if (error) {
    // Intentar con nombre alternativo si la tabla no existe
    if (error.code === '42P01') {
      const alt = await supabaseAdmin
        .from('log_auditoria')
        .select('*, usuario:usuarios(id,nombre,apellido)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      if (!alt.error) return NextResponse.json({ data: alt.data ?? [], total: alt.count ?? 0 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}
