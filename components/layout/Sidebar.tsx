'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Usuario } from '@/lib/types'
import {
  LayoutDashboard, FolderKanban, GitBranch, CheckSquare,
  Users, Shield, GitMerge, Menu, X, BarChart3, ChevronLeft, ChevronRight, ScrollText
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

export default function Sidebar({ usuario }: { usuario: Usuario & { rol?: any } }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const permisos = usuario.rol?.permisos ?? []
  const canSee = (seccion: string) => {
    if (usuario.is_admin) return true
    return permisos.some((p: any) => p.seccion === seccion && p.puede_leer)
  }
  const navItems = NAV_ITEMS.filter(item => canSee(item.seccion))

  return (
    <>
      <button className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1B2A4A] text-white rounded-lg shadow"
        onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 bg-[#1B2A4A] flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className={cn("border-b border-white/10 flex items-center", collapsed ? "p-3 justify-center" : "p-4 gap-3")}>
          {!collapsed && (
            <>
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full flex-shrink-0"
                onError={e => { e.currentTarget.style.display='none' }} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-tight">SIAP</p>
                <p className="text-white/50 text-[9px] leading-tight">Sistema Administración Proyectos</p>
                <p className="text-white/30 text-[9px]">v2.1.0 · Ministerio de Economía</p>
              </div>
            </>
          )}
          {collapsed && (
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full"
              onError={e => { e.currentTarget.style.display='none' }} />
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex text-white/40 hover:text-white transition-colors p-1 rounded flex-shrink-0">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all",
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5",
                  active ? "bg-[#2B6CB0] text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                )}>
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className={cn("border-t border-white/10", collapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <div className="w-8 h-8 rounded-full bg-[#2B6CB0] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{usuario.nombre} {usuario.apellido}</p>
                <p className="text-white/40 text-[10px]">{usuario.is_admin ? 'Administrador' : usuario.rol?.nombre ?? 'Sin rol'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
