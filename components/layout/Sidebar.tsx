'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Usuario } from '@/lib/types'
import {
  LayoutDashboard, FolderKanban, GitBranch, CheckSquare,
  Users, Shield, GitMerge, Menu, X, BarChart3
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Dashboard Directivo',  icon: LayoutDashboard, seccion: 'dashboard_directivo' },
  { href: '/dashboard-ejecutivo',  label: 'Dashboard Ejecutivo',  icon: BarChart3,       seccion: 'dashboard_ejecutivo' },
  { href: '/flujograma',           label: 'Flujograma',           icon: GitMerge,        seccion: 'flujograma' },
  { href: '/proyectos',            label: 'Proyectos',            icon: FolderKanban,    seccion: 'proyectos' },
  { href: '/lineas-accion',        label: 'Líneas de Acción',     icon: GitBranch,       seccion: 'lineas_accion' },
  { href: '/tareas',               label: 'Tareas',               icon: CheckSquare,     seccion: 'tareas' },
  { href: '/usuarios',             label: 'Usuarios',             icon: Users,           seccion: 'usuarios' },
  { href: '/roles',                label: 'Roles',                icon: Shield,          seccion: 'roles' },
]

export default function Sidebar({ usuario }: { usuario: Usuario & { rol?: any } }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const permisos = usuario.rol?.permisos ?? []
  const canSee = (seccion: string) => {
    if (usuario.is_admin) return true
    return permisos.some((p: any) => p.seccion === seccion && p.puede_leer)
  }

  const navItems = NAV_ITEMS.filter(item => canSee(item.seccion))

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1B2A4A] text-white rounded-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#1B2A4A] flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center">
              <span className="text-[#1B2A4A] font-bold text-xs">S</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">SIAP</p>
              <p className="text-white/40 text-xs">Ministerio de Economía</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-[#C9A84C] text-[#1B2A4A]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {usuario.avatar_url ? (
              <img src={usuario.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {usuario.nombre[0]}{usuario.apellido[0]}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{usuario.nombre} {usuario.apellido}</p>
              <p className="text-white/40 text-xs truncate">{usuario.is_admin ? 'Administrador' : usuario.rol?.nombre ?? 'Sin rol'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
