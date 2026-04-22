import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth_error', origin))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    return NextResponse.redirect(new URL('/login?error=auth_error', origin))
  }

  // Buscar por auth_user_id primero
  let { data: usuarioApp } = await supabase
    .from('usuarios')
    .select('id, activo, email')
    .eq('auth_user_id', user.id)
    .single()

  // Si no encuentra por auth_user_id, buscar por email y enlazar
  if (!usuarioApp) {
    const { data: usuarioPorEmail } = await supabase
      .from('usuarios')
      .select('id, activo, email')
      .eq('email', user.email!)
      .single()

    if (usuarioPorEmail) {
      await supabase
        .from('usuarios')
        .update({ auth_user_id: user.id, avatar_url: user.user_metadata?.avatar_url })
        .eq('id', usuarioPorEmail.id)
      usuarioApp = usuarioPorEmail
    }
  }

  // Si no encuentra por ninguno, crear usuario pendiente y denegar
  if (!usuarioApp) {
    return NextResponse.redirect(new URL('/login?error=sin_acceso', origin))
  }

  if (!usuarioApp.activo) {
    return NextResponse.redirect(new URL('/login?error=inactivo', origin))
  }

  return NextResponse.redirect(new URL('/dashboard', origin))
}
