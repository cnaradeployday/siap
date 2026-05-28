import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const BUCKET = 'sistema'

async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') // 'logo' | 'manual'
  if (!tipo || !['logo', 'manual'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Sin archivo' }, { status: 400 })

  await ensureBucket()

  const ext = file.name.split('.').pop()
  const filename = tipo === 'logo' ? `logo.${ext}` : `manual.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename)

  // Add cache-busting timestamp
  const urlWithBust = `${publicUrl}?t=${Date.now()}`

  await supabaseAdmin
    .from('configuracion')
    .upsert({ clave: `${tipo}_url`, valor: urlWithBust, updated_at: new Date().toISOString() }, { onConflict: 'clave' })

  return NextResponse.json({ url: urlWithBust })
}
