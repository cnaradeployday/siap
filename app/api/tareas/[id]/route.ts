import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { dependencias, ...tareaData } = body
  const { data, error } = await supabaseAdmin
    .from('tareas').update(tareaData).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (dependencias !== undefined) {
    await supabaseAdmin.from('dependencias_tareas').delete().eq('tarea_id', params.id)
    if (dependencias.length) {
      await supabaseAdmin.from('dependencias_tareas').insert(
        dependencias.map((d: string) => ({ tarea_id: params.id, depende_de_id: d }))
      )
    }
  }
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from('tareas').update({ deleted_at: new Date().toISOString() }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
