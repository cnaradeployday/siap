import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    if (!error && user) {
      // Verificar que el usuario existe y está activo
      const { data: usuarioApp } = await supabase
        .from('usuarios')
        .select('id, activo, is_admin')
        .eq('auth_user_id', user.id)
        .single()

      // Si no está enlazado, buscar por email y enlazar automáticamente
      if (!usuarioApp) {
        const { data: usuarioPorEmail } = await supabase
          .from('usuarios')
          .select('id, activo, email')
          .eq('email', user.email!)
          .single()

        if (usuarioPorEmail && usuarioPorEmail.activo) {
          await supabase
            .from('usuarios')
            .update({ 
              auth_user_id: user.id,
              avatar_url: user.user_metadata?.avatar_url 
            })
            .eq('id', usuarioPorEmail.id)
          return NextResponse.redirect(new URL('/dashboard', origin))
        }
        return NextResponse.redirect(new URL('/login?error=sin_acceso', origin))
      }

      if (!usuarioApp.activo) {
        return NextResponse.redirect(new URL('/login?error=inactivo', origin))
      }

      return NextResponse.redirect(new URL('/dashboard', origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_error', origin))
}
