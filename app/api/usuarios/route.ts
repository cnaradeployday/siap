import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, rol:roles(id,nombre)')
    .order('apellido')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createServiceClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('usuarios').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
