'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Usuario, Organizacion } from '@/lib/types'
import {
  LayoutDashboard, FolderKanban, GitBranch, CheckSquare,
  Users, Shield, GitMerge, Menu, X, BarChart3, ChevronLeft, ChevronRight, ScrollText, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',           label: 'Dashboard Directivo',  icon: LayoutDashboard, seccion: 'dashboard_directivo' },
  { href: '/dashboard-ejecutivo', label: 'Dashboard Ejecutivo',  icon: BarChart3,       seccion: 'dashboard_ejecutivo' },
  { href: '/flujograma',          label: 'Flujograma',           icon: GitMerge,        seccion: 'flujograma' },
  { href: '/proyectos',           label: 'Proyectos',            icon: FolderKanban,    seccion: 'proyectos' },
  { href: '/lineas-accion',       label: 'Líneas de Acción',     icon: GitBranch,       seccion: 'lineas_accion' },
  { href: '/tareas',              label: 'Tareas',               icon: CheckSquare,     seccion: 'tareas' },
  { href: '/usuarios',            label: 'Usuarios',             icon: Users,           seccion: 'usuarios' },
  { href: '/roles',               label: 'Roles',                icon: Shield,          seccion: 'roles' },
  { href: '/logs',                label: 'Logs',                 icon: ScrollText,      seccion: 'logs' },
]

interface Props {
  usuario: Usuario & { rol?: any }
  org: Organizacion | null
}

export default function Sidebar({ usuario, org }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const isDark = (org?.tema ?? 'dark') === 'dark'
  const colorPrimario = org?.color_primario ?? '#1B2A4A'
  const colorAcento   = org?.color_acento   ?? '#2B6CB0'

  // Colores de texto según tema
  const textMain    = isDark ? 'text-white'
                             : 'text-gray-800'
  const textMuted   = isDark ? 'text-white/60'
                             : 'text-gray-500'
  const textFaint   = isDark ? 'text-white/30'
                             : 'text-gray-400'
  const borderColor = isDark ? 'border-white/10'
                             : 'border-gray-200'
  const hoverBg     = isDark ? 'hover:bg-white/10'
                             : 'hover:bg-black/5'

  const permisos = usuario.rol?.permisos ?? []
  const canSee = (seccion: string) => {
    if (usuario.is_admin || usuario.is_super_admin) return true
    return permisos.some((p: any) => p.seccion === seccion && p.puede_leer)
  }
  const navItems = NAV_ITEMS.filter(item => canSee(item.seccion))

  async function handleSalirOrg() {
    await fetch('/api/super/enter-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: null }),
    })
    router.push('/configuracion')
  }

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow"
        style={{ backgroundColor: colorPrimario, color: isDark ? '#fff' : '#111' }}
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ backgroundColor: colorPrimario }}
      >
        {/* Logo / nombre org */}
        <div className={cn("border-b flex items-center", borderColor, collapsed ? "p-3 justify-center" : "p-4 gap-3")}>
          {!collapsed && (
            <>
              {org?.logo_url && (
                <img
                  src={org.logo_url}
                  alt="Logo"
                  className="w-8 h-8 object-contain rounded-full flex-shrink-0"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("font-bold text-sm leading-tight", textMain)}>SIAP</p>
                <p className={cn("text-[9px] leading-tight", textMuted)}>{org?.texto_sidebar ?? 'Sistema Administración Proyectos'}</p>
                <p className={cn("text-[9px]", textFaint)}>{org?.nombre ?? ''}</p>
              </div>
            </>
          )}
          {collapsed && org?.logo_url && (
            <img
              src={org.logo_url}
              alt="Logo"
              className="w-8 h-8 object-contain rounded-full"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
          {collapsed && !org?.logo_url && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: colorAcento, color: '#fff' }}>
              {org?.nombre?.[0] ?? 'S'}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("hidden md:flex transition-colors p-1 rounded flex-shrink-0", textFaint, isDark ? 'hover:text-white' : 'hover:text-gray-800')}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  active ? '' : cn(textMuted, hoverBg, isDark ? 'hover:text-white' : 'hover:text-gray-800')
                )}
                style={active ? { backgroundColor: colorAcento, color: '#fff' } : undefined}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer usuario */}
        <div className={cn("border-t", borderColor, collapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: colorAcento }}
            >
              <span className="text-white text-xs font-bold">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className={cn("text-xs font-medium truncate", textMain)}>{usuario.nombre} {usuario.apellido}</p>
                <p className={cn("text-[10px]", textFaint)}>
                  {usuario.is_super_admin ? 'Super Admin' : usuario.is_admin ? 'Administrador' : usuario.rol?.nombre ?? 'Sin rol'}
                </p>
              </div>
            )}
          </div>
          {usuario.is_super_admin && !collapsed && (
            <button
              onClick={handleSalirOrg}
              className={cn("mt-3 w-full flex items-center gap-2 text-xs transition-colors", textFaint, isDark ? 'hover:text-white' : 'hover:text-gray-800')}
            >
              <LogOut size={12} /> Salir de la organización
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
