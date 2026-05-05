import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const body = await req.json()
  const uuidFields = ['responsable_id', 'tarea_id', 'depende_de_id']
  for (const f of uuidFields) {
    if (f in body && (body[f] === '' || body[f] === undefined)) body[f] = null
  }
  const { data, error } = await supabaseAdmin.from('subtareas').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
