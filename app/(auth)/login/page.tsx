import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { ROOT_DOMAIN } from '@/lib/root-domain'
import { getOrgSlugFromHost } from '@/lib/org-slug-from-host'
import LoginForm from './LoginForm'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function LoginPage() {
  const headersList = await headers()
  const orgSlug = getOrgSlugFromHost(headersList.get('host'), ROOT_DOMAIN)

  let org = null
  if (orgSlug) {
    const { data } = await supabaseAdmin
      .from('organizaciones')
      .select('nombre, texto_sidebar, logo_url, color_primario, color_acento')
      .eq('slug', orgSlug)
      .eq('activo', true)
      .maybeSingle()
    org = data
  }

  return <LoginForm org={org} />
}
