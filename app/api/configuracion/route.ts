import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clave = searchParams.get('clave')

  if (clave) {
    const { data } = await supabaseAdmin.from('configuracion').select('valor').eq('clave', clave).single()
    return NextResponse.json(data?.valor ?? null)
  }

  const { data } = await supabaseAdmin.from('configuracion').select('*')
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const { clave, valor } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('configuracion')
    .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: 'clave' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
