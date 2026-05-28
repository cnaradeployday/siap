import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(null)

  const { data } = await supabaseAdmin
    .from('usuarios')
    .select('*, proyecto_ids:usuario_proyectos(proyecto_id)')
    .eq('auth_user_id', user.id)
    .single()

  return NextResponse.json(data)
}
