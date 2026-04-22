import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data.users.map(u => ({ id: u.id, email: u.email })))
}
