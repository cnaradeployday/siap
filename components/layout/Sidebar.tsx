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
  { href: '/dashboard',           label: 'Dashboard Directivo',  icon: LayoutDashboard, seccion: 'dashboard_directivo' },
  { href: '/dashboard-ejecutivo', label: 'Dashboard Ejecutivo',  icon: BarChart3,       seccion: 'dashboard_ejecutivo' },
  { href: '/flujograma',          label: 'Flujograma',           icon: GitMerge,        seccion: 'flujograma' },
  { href: '/proyectos',           label: 'Proyectos',            icon: FolderKanban,    seccion: 'proyectos' },
  { href: '/lineas-accion',       label: 'Líneas de Acción',     icon: GitBranch,       seccion: 'lineas_accion' },
  { href: '/tareas',              label: 'Tareas',               icon: CheckSquare,     seccion: 'tareas' },
  { href: '/usuarios',            label: 'Usuarios',             icon: Users,           seccion: 'usuarios' },
  { href: '/roles',               label: 'Roles',                icon: Shield,          seccion: 'roles' },
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
      <button className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1B2A4A] text-white rounded-lg shadow"
        onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setOpen(false)} />}

      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-60 bg-[#1B2A4A] flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 object-contain rounded-full"
            onError={(e) => { e.currentTarget.style.display='none' }} />
          <div>
            <p className="text-white font-bold text-sm leading-tight">SIAP</p>
            <p className="text-white/40 text-[10px]">Ministerio de Economía</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active ? "bg-[#2B6CB0] text-white" : "text-white/60 hover:text-white hover:bg-white/10"
                )}>
                <item.icon size={17} className={active ? "text-[#90CDF4]" : ""} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2B6CB0] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {usuario.nombre[0]}{usuario.apellido[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{usuario.nombre} {usuario.apellido}</p>
              <p className="text-white/40 text-[10px]">{usuario.is_admin ? 'Administrador' : usuario.rol?.nombre ?? 'Sin rol'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
