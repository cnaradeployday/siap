import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { auth_user_id, password } = await req.json()
  if (!auth_user_id || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }
  const supabase = await createServiceClient()
  const { error } = await supabase.auth.admin.updateUserById(auth_user_id, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
