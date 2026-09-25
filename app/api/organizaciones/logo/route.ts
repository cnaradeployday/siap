import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const TAMANO_MAXIMO = 2 * 1024 * 1024 // 2MB

async function checkSuperAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabaseAdmin
    .from('usuarios').select('is_super_admin').eq('auth_user_id', user.id).single()
  return !!data?.is_super_admin
}

export async function POST(req: Request) {
  const ok = await checkSuperAdmin()
  if (!ok) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Archivo faltante' }, { status: 400 })

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json({ error: 'Formato inválido. Usá PNG, JPG, WEBP o SVG.' }, { status: 400 })
  }
  if (file.size > TAMANO_MAXIMO) {
    return NextResponse.json({ error: 'El archivo supera los 2MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'png'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('logos')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 })

  const { data } = supabaseAdmin.storage.from('logos').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
