import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password_actual, password_nuevo } = await req.json()
  
  // Verificar contraseña actual
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Cambiar contraseña
  const { error } = await supabase.auth.updateUser({ password: password_nuevo })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  return NextResponse.json({ ok: true })
}
