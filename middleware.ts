import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase()

// Extrae el slug de organización del subdominio (ej: "corrientes" de corrientes.tudominio.com)
function getOrgSlugFromHost(host: string | null): string | null {
  if (!ROOT_DOMAIN || !host) return null
  const hostname = host.split(':')[0].toLowerCase()
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) return null
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return null
  return hostname.slice(0, -(ROOT_DOMAIN.length + 1))
}

async function resolveOrgIdFromSubdomain(request: NextRequest): Promise<string | null> {
  const orgSlug = getOrgSlugFromHost(request.headers.get('host'))
  if (!orgSlug) return null

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: org } = await supabaseAdmin
    .from('organizaciones').select('id').eq('slug', orgSlug).eq('activo', true).maybeSingle()

  return org?.id ?? null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const orgId = await resolveOrgIdFromSubdomain(request)

  const applyOrgCookie = (response: NextResponse) => {
    if (orgId) {
      response.cookies.set('active_org_id', orgId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 horas
      })
    }
    return response
  }

  if (!user && !pathname.startsWith('/login')) {
    return applyOrgCookie(NextResponse.redirect(new URL('/login', request.url)))
  }

  if (user && pathname === '/login') {
    return applyOrgCookie(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  return applyOrgCookie(supabaseResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
