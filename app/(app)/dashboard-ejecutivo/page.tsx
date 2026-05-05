'use client'

import { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
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
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [tareasExpandidas, setTareasExpandidas] = useState<Set<string>>(new Set())
  const [tareasMap, setTareasMap] = useState<Record<string, any[]>>({})
  const [sortField, setSortField] = useState('nombre')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [p, u] = await Promise.all([
      fetch('/api/proyectos').then(r => r.json()),
      fetch('/api/usuarios').then(r => r.json()),
    ])
    const ps = Array.isArray(p) ? p : []
    setProyectos(ps)
    setUsuarios(Array.isArray(u) ? u : [])
    setExpandidos(new Set())
    setLoading(false)
  }

  function getEstadoReal(p: Proyecto): EstadoItem {
    const lineas = (p.lineas_accion as any[]) ?? []
    if (!lineas.length) return p.estado
    return calcularEstadoProyecto(lineas.map((l: any) => calcularEstadoReal(l.estado, l.fecha_fin)))
  }

  const proyectosConEstado = proyectos.map(p => ({ ...p, estadoReal: getEstadoReal(p) }))

  const patrocinadores = proyectos
    .filter(p => p.patrocinador_id && (p.patrocinador as any))
    .map(p => p.patrocinador as any)
    .filter((u: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === u.id) === i)
    .sort((a: any, b: any) => a.apellido.localeCompare(b.apellido))

  const kpis = {
    total: proyectosConEstado.length,
    en_proceso: proyectosConEstado.filter(p => p.estadoReal === 'en_proceso').length,
    bloqueado: proyectosConEstado.filter(p => p.estadoReal === 'bloqueado').length,
    vencido: proyectosConEstado.filter(p => p.estadoReal === 'vencido').length,
    completado: proyectosConEstado.filter(p => p.estadoReal === 'completado').length,
  }

  function toggleExpand(id: string) {
    setExpandidos(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  async function toggleTareas(lineaId: string) {
    if (tareasExpandidas.has(lineaId)) {
      setTareasExpandidas(prev => { const n = new Set(prev); n.delete(lineaId); return n })
      return
    }
    if (!tareasMap[lineaId]) {
      const data = await fetch(`/api/tareas?lineaId=${lineaId}`).then(r => r.json())
      setTareasMap(prev => ({ ...prev, [lineaId]: Array.isArray(data) ? data : [] }))
    }
    setTareasExpandidas(prev => new Set([...prev, lineaId]))
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: kpis.total, color: 'bg-[#1B2A4A]', text: 'text-white', estado: '' },
          { label: 'En proceso', value: kpis.en_proceso, color: 'bg-blue-50', text: 'text-blue-700', estado: 'en_proceso' },
          { label: 'Bloqueados', value: kpis.bloqueado, color: 'bg-red-50', text: 'text-red-700', estado: 'bloqueado' },
          { label: 'Demorados', value: kpis.vencido, color: 'bg-red-100', text: 'text-red-900', estado: 'vencido' },
          { label: 'Completados', value: kpis.completado, color: 'bg-green-50', text: 'text-green-700', estado: 'completado' },
        ].map(k => (
          <div key={k.label} onClick={() => setFiltroEstado(filtroEstado === k.estado ? '' : k.estado)}
            className={`${k.color} rounded-xl p-4 cursor-pointer transition-all hover:opacity-80 ${filtroEstado === k.estado && k.estado !== '' ? 'ring-2 ring-offset-1 ring-[#2B6CB0]' : ''}`}>
            <span className={`text-3xl font-bold ${k.text}`}>{k.value}</span>
            <p className={`text-xs mt-1 ${k.text} opacity-70`}>{k.label}</p>
          </div>
        ))}
      </div>

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
          {patrocinadores.map((u: any) => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
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
                  <th className="w-8 px-2 py-3"></th>
                  {[['nombre','Proyecto'],['estadoReal','Estado'],['patrocinador','Patrocinador'],['fecha_inicio','Inicio'],['fecha_fin','Fin']].map(([f,l]) => (
                    <th key={f} onClick={() => toggleSort(f)}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase tracking-wider cursor-pointer hover:bg-[#EBF8FF] transition-colors select-none">
                      {l}<SortIcon field={f} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase text-left">Resp. Línea</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const lineas = [...((p.lineas_accion as any[]) ?? [])].sort((a, b) => a.orden - b.orden)
                  const expanded = expandidos.has(p.id)
                  return (
                    <>
                      <tr key={p.id} className="hover:bg-[#F0F4F8] bg-[#F8FAFC] cursor-pointer"
                        onClick={() => toggleExpand(p.id)}>
                        <td className="px-2 py-3 text-center text-gray-400">
                          {lineas.length > 0 && (expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1B2A4A]">{p.nombre}</td>
                        <td className="px-4 py-3"><StatusBadge estado={p.estadoReal} fechaFin={p.fecha_fin} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {(p.patrocinador as any) ? `${(p.patrocinador as any).apellido}, ${(p.patrocinador as any).nombre}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.fecha_inicio)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.fecha_fin)}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{lineas.length} línea{lineas.length !== 1 ? 's' : ''}</td>
                      </tr>
                      {expanded && lineas.map((l: any) => {
                        const er = calcularEstadoReal(l.estado, l.fecha_fin)
                        const tareasAbiertas = tareasExpandidas.has(l.id)
                        const tareasDeLinea = tareasMap[l.id] ?? []
                        return (
                          <>
                            <tr key={l.id} className="hover:bg-[#F0F4F8] border-l-4 border-[#2B6CB0]">
                              <td className="px-2 py-2.5 text-center text-gray-400">
                                <button onClick={e => { e.stopPropagation(); toggleTareas(l.id) }}
                                  className="hover:text-[#2B6CB0] transition-colors">
                                  {tareasAbiertas ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                </button>
                              </td>
                              <td className="px-4 py-2.5 text-[#1B2A4A] text-xs">
                                <span className="font-semibold text-[#2B6CB0] mr-1">{['I','II','III'][l.orden-1] ?? l.orden}.</span>
                                {l.nombre}
                              </td>
                              <td className="px-4 py-2.5"><StatusBadge estado={er} size="sm" /></td>
                              <td className="px-4 py-2.5 text-gray-400 text-xs">—</td>
                              <td className="px-4 py-2.5 text-gray-400 text-xs">{formatDate(l.fecha_inicio)}</td>
                              <td className="px-4 py-2.5 text-gray-400 text-xs">{formatDate(l.fecha_fin)}</td>
                              <td className="px-4 py-2.5 text-gray-500 text-xs">
                                {l.responsable ? `${l.responsable.apellido}, ${l.responsable.nombre}` : '-'}
                              </td>
                            </tr>
                            {tareasAbiertas && (
                              tareasDeLinea.length === 0 ? (
                                <tr key={`${l.id}-empty`} className="border-l-4 border-[#2B6CB0]">
                                  <td></td>
                                  <td colSpan={6} className="px-4 py-2 pl-10 text-xs text-gray-400 italic bg-gray-50/50">Sin tareas</td>
                                </tr>
                              ) : tareasDeLinea.map((t: any) => (
                                <tr key={t.id} className="border-l-4 border-[#2B6CB0] bg-white">
                                  <td></td>
                                  <td className="px-4 py-2 pl-10 text-xs text-[#1B2A4A]" colSpan={2}>
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        t.estado === 'completado' ? 'bg-green-500' :
                                        t.estado === 'bloqueado' || calcularEstadoReal(t.estado, t.fecha_fin) === 'vencido' ? 'bg-red-500' :
                                        t.estado === 'en_proceso' ? 'bg-blue-500' : 'bg-gray-400'
                                      }`} />
                                      {t.nombre}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2 text-xs text-gray-400">—</td>
                                  <td className="px-4 py-2 text-xs text-gray-400">{formatDate(t.fecha_inicio)}</td>
                                  <td className="px-4 py-2 text-xs text-gray-400">{formatDate(t.fecha_fin)}</td>
                                  <td className="px-4 py-2 text-xs text-gray-500">
                                    {t.responsable ? `${t.responsable.apellido}, ${t.responsable.nombre}` : '-'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </>
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
