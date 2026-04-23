'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import { Proyecto, Usuario, EstadoItem, ESTADO_LABELS } from '@/lib/types'
import { formatDate, calcularEstadoProyecto, calcularEstadoReal } from '@/lib/utils'

const ESTADOS: EstadoItem[] = ['pendiente', 'en_proceso', 'bloqueado', 'vencido', 'completado']

export default function DashboardEjecutivoPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPatrocinador, setFiltroPatrocinador] = useState('')
  const [filtroResponsable, setFiltroResponsable] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('')
  const [sortField, setSortField] = useState('nombre')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [p, u] = await Promise.all([
      fetch('/api/proyectos').then(r => r.json()),
      fetch('/api/usuarios').then(r => r.json()),
    ])
    setProyectos(Array.isArray(p) ? p : [])
    setUsuarios(Array.isArray(u) ? u : [])
    setLoading(false)
  }

  function getEstadoReal(p: Proyecto): EstadoItem {
    const lineas = (p.lineas_accion as any[]) ?? []
    if (!lineas.length) return p.estado
    const estados = lineas.map((l: any) => calcularEstadoReal(l.estado, l.fecha_fin))
    return calcularEstadoProyecto(estados)
  }

  const proyectosConEstado = proyectos.map(p => ({ ...p, estadoReal: getEstadoReal(p) }))

  const kpis = {
    total: proyectosConEstado.length,
    en_proceso: proyectosConEstado.filter(p => p.estadoReal === 'en_proceso').length,
    bloqueado: proyectosConEstado.filter(p => p.estadoReal === 'bloqueado').length,
    vencido: proyectosConEstado.filter(p => p.estadoReal === 'vencido').length,
    completado: proyectosConEstado.filter(p => p.estadoReal === 'completado').length,
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  )

  const filtered = proyectosConEstado
    .filter(p => {
      const q = search.toLowerCase()
      const lineas = (p.lineas_accion as any[]) ?? []
      const matchSearch = !q || p.nombre.toLowerCase().includes(q)
      const matchEstado = !filtroEstado || p.estadoReal === filtroEstado
      const matchPat = !filtroPatrocinador || p.patrocinador_id === filtroPatrocinador
      const matchProy = !filtroProyecto || p.id === filtroProyecto
      const matchResp = !filtroResponsable || lineas.some((l: any) => l.responsable?.id === filtroResponsable)
      return matchSearch && matchEstado && matchPat && matchProy && matchResp
    })
    .sort((a, b) => {
      const av = (a as any)[sortField] ?? ''
      const bv = (b as any)[sortField] ?? ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-1">Dashboard Ejecutivo</h1>
      <p className="text-gray-400 text-sm mb-6">Vista operativa con filtro por responsable</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: kpis.total, color: 'bg-[#1B2A4A]', text: 'text-white' },
          { label: 'En proceso', value: kpis.en_proceso, color: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Bloqueados', value: kpis.bloqueado, color: 'bg-red-50', text: 'text-red-700' },
          { label: 'Vencidos', value: kpis.vencido, color: 'bg-red-100', text: 'text-red-900' },
          { label: 'Completados', value: kpis.completado, color: 'bg-green-50', text: 'text-green-700' },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-xl p-4`}>
            <span className={`text-3xl font-bold ${k.text}`}>{k.value}</span>
            <p className={`text-xs mt-1 ${k.text} opacity-70`}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar proyecto..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]" />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
        </select>
        <select value={filtroPatrocinador} onChange={e => setFiltroPatrocinador(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los patrocinadores</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
        </select>
        <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los responsables</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
        </select>
        <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* Tabla con líneas expandidas ordenadas */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4F8] border-b border-gray-100">
                <tr>
                  {[['nombre','Proyecto'],['estadoReal','Estado'],['patrocinador','Patrocinador'],['fecha_inicio','Inicio'],['fecha_fin','Fin']].map(([f,l]) => (
                    <th key={f} onClick={() => toggleSort(f)}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase tracking-wider cursor-pointer hover:bg-[#EBF8FF] transition-colors select-none">
                      {l}<SortIcon field={f} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase text-left">Responsable línea</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const lineas = [...((p.lineas_accion as any[]) ?? [])].sort((a, b) => a.orden - b.orden)
                  return (
                    <>
                      <tr key={p.id} className="hover:bg-[#F0F4F8] bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-semibold text-[#1B2A4A]">{p.nombre}</td>
                        <td className="px-4 py-3"><StatusBadge estado={p.estadoReal} fechaFin={p.fecha_fin} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {(p.patrocinador as any) ? `${(p.patrocinador as any).apellido}, ${(p.patrocinador as any).nombre}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.fecha_inicio)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.fecha_fin)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{lineas.length} línea{lineas.length !== 1 ? 's' : ''}</td>
                      </tr>
                      {lineas.map((l: any) => {
                        const er = calcularEstadoReal(l.estado, l.fecha_fin)
                        return (
                          <tr key={l.id} className="hover:bg-[#F0F4F8] border-l-2 border-[#2B6CB0]">
                            <td className="px-4 py-2.5 pl-10 text-[#1B2A4A] text-xs">
                              <span className="font-medium text-[#2B6CB0] mr-1">{['I','II','III'][l.orden-1] ?? l.orden}.</span>
                              {l.nombre}
                            </td>
                            <td className="px-4 py-2.5">
                              <StatusBadge estado={er} size="sm" />
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">—</td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{formatDate(l.fecha_inicio)}</td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{formatDate(l.fecha_fin)}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {l.responsable ? `${l.responsable.apellido}, ${l.responsable.nombre}` : '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
