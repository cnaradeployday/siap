'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Super admin modal
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')

  const errorMessages: Record<string, string> = {
    sin_acceso: 'Tu cuenta no tiene acceso al sistema. Contactá al administrador.',
    inactivo: 'Tu cuenta está desactivada. Contactá al administrador.',
    auth_error: 'Error de autenticación. Intentá de nuevo.',
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setLoginError('Completá email y contraseña'); return }
    setLoading(true)
    setLoginError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setLoginError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoginError('Error al obtener usuario'); setLoading(false); return }

    const { data: usuarioApp } = await supabase
      .from('usuarios').select('id, activo, is_super_admin').eq('auth_user_id', user.id).single()

    if (!usuarioApp) {
      const { data: porEmail } = await supabase
        .from('usuarios').select('id, activo').eq('email', user.email!).single()
      if (!porEmail || !porEmail.activo) {
        await supabase.auth.signOut()
        setLoginError('Tu cuenta no tiene acceso. Contactá al administrador.')
        setLoading(false)
        return
      }
    } else if (!usuarioApp.activo) {
      await supabase.auth.signOut()
      setLoginError('Tu cuenta está desactivada.')
      setLoading(false)
      return
    }

    if (usuarioApp?.is_super_admin) {
      router.push('/configuracion')
    } else {
      router.push('/dashboard')
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!adminEmail || !adminPass) { setAdminError('Completá email y contraseña'); return }
    setAdminLoading(true)
    setAdminError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPass,
    })
    if (authError) {
      setAdminError('Email o contraseña incorrectos')
      setAdminLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdminError('Error de autenticación'); setAdminLoading(false); return }

    const { data: u } = await supabase
      .from('usuarios').select('is_super_admin, activo').eq('auth_user_id', user.id).single()

    if (!u?.is_super_admin) {
      await supabase.auth.signOut()
      setAdminError('Este usuario no tiene acceso de super administrador.')
      setAdminLoading(false)
      return
    }

    if (!u.activo) {
      await supabase.auth.signOut()
      setAdminError('Tu cuenta está desactivada.')
      setAdminLoading(false)
      return
    }

    router.push('/configuracion')
  }

  return (
    <div className="min-h-screen bg-[#1B2A4A] flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Ministerio de Economía"
            className="w-24 h-24 mb-6 object-contain rounded-full"
            onError={e => { e.currentTarget.style.display = 'none' }} />
          <h1 className="text-3xl font-bold text-white tracking-tight">SIAP</h1>
          <p className="text-[#C9A84C] text-sm mt-1 tracking-widest uppercase">
            Sistema de Seguimiento de Proyectos
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <h2 className="text-white text-xl font-semibold mb-1">Iniciar sesión</h2>
          <p className="text-white/40 text-sm mb-6">Ingresá con tu email y contraseña</p>

          {(error || loginError) && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{loginError || errorMessages[error!] || 'Error desconocido'}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
            <div>
              <label className="block text-white/60 text-sm mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-white/60 text-sm mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors text-sm"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs">
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#b8963e] disabled:opacity-50 text-[#1B2A4A] font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm mt-2">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-transparent text-white/30">o continuá con</span>
            </div>
          </div>

          {/* Google */}
          <button onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-xl transition-all duration-200 text-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Ingresar con Google
          </button>
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          Ministerio de Economía — República Argentina
        </p>
      </div>

      {/* Punto ámbar — acceso super admin */}
      <button
        onClick={() => { setAdminModalOpen(true); setAdminError(''); setAdminEmail(''); setAdminPass('') }}
        className="absolute bottom-4 left-4 w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-300 transition-colors opacity-60 hover:opacity-100"
        title=""
        aria-label=""
      />

      {/* Modal super admin */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setAdminModalOpen(false) }}>
          <div className="bg-[#1B2A4A] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-semibold mb-1">Administración</h3>
            <p className="text-white/40 text-xs mb-5">Acceso restringido</p>

            {adminError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="Email"
                autoComplete="off"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors text-sm"
              />
              <input
                type="password"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                placeholder="Contraseña"
                autoComplete="off"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors text-sm"
              />
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setAdminModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-white/50 hover:text-white border border-white/10 text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={adminLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#b8963e] text-[#1B2A4A] font-semibold text-sm transition-colors disabled:opacity-50">
                  {adminLoading ? '...' : 'Ingresar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
