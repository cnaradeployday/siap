'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import { Proyecto, Usuario, EstadoItem, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/types'
import { formatDate, calcularEstadoProyecto } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORES: Record<EstadoItem, string> = {
  pendiente: '#D97706', en_proceso: '#2563EB',
  bloqueado: '#DC2626', vencido: '#7F1D1D', completado: '#059669'
}

export default function DashboardDirectivoPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPatrocinador, setFiltroPatrocinador] = useState('')
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
    const hoy = new Date()
    const estados = lineas.map((l: any) => {
      if (l.estado === 'completado' || l.estado === 'cancelado') return l.estado
      if (new Date(l.fecha_fin) < hoy) return 'vencido'
      return l.estado
    })
    return calcularEstadoProyecto(estados)
  }

  const proyectosConEstado = proyectos.map(p => ({ ...p, estadoReal: getEstadoReal(p) }))

  const kpis = {
    total: proyectosConEstado.length,
    en_proceso: proyectosConEstado.filter(p => p.estadoReal === 'en_proceso').length,
    bloqueado: proyectosConEstado.filter(p => p.estadoReal === 'bloqueado').length,
    vencido: proyectosConEstado.filter(p => p.estadoReal === 'vencido').length,
    completado: proyectosConEstado.filter(p => p.estadoReal === 'completado').length,
    pendiente: proyectosConEstado.filter(p => p.estadoReal === 'pendiente').length,
  }

  const pieData = (['pendiente','en_proceso','bloqueado','vencido','completado'] as EstadoItem[])
    .map(e => ({ name: ESTADO_LABELS[e], value: proyectosConEstado.filter(p => p.estadoReal === e).length, color: COLORES[e] }))
    .filter(d => d.value > 0)

  const barData = proyectosConEstado.map(p => ({
    name: p.nombre.length > 20 ? p.nombre.slice(0, 20) + '...' : p.nombre,
    lineas: ((p.lineas_accion as any[]) ?? []).length,
    completadas: ((p.lineas_accion as any[]) ?? []).filter((l: any) => l.estado === 'completado').length,
  }))

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
      const matchSearch = !q || p.nombre.toLowerCase().includes(q)
      const matchEstado = !filtroEstado || p.estadoReal === filtroEstado
      const matchPat = !filtroPatrocinador || p.patrocinador_id === filtroPatrocinador
      const matchProy = !filtroProyecto || p.id === filtroProyecto
      return matchSearch && matchEstado && matchPat && matchProy
    })
    .sort((a, b) => {
      const av = (a as any)[sortField] ?? ''
      const bv = (b as any)[sortField] ?? ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-1">Dashboard Directivo</h1>
      <p className="text-gray-400 text-sm mb-6">Resumen ejecutivo del estado de proyectos</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total', value: kpis.total, color: 'bg-[#1B2A4A]', text: 'text-white' },
          { label: 'En proceso', value: kpis.en_proceso, color: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Pendientes', value: kpis.pendiente, color: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Bloqueados', value: kpis.bloqueado, color: 'bg-red-50', text: 'text-red-700' },
          { label: 'Vencidos', value: kpis.vencido, color: 'bg-red-100', text: 'text-red-900' },
          { label: 'Completados', value: kpis.completado, color: 'bg-green-50', text: 'text-green-700' },
        ].map(k => (
          <div key={k.label} className={`${k.color} rounded-xl p-4 flex flex-col`}>
            <span className={`text-3xl font-bold ${k.text}`}>{k.value}</span>
            <span className={`text-xs mt-1 ${k.text} opacity-70`}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      {proyectosConEstado.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1B2A4A] mb-4">Distribución por estado</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-[#1B2A4A] mb-4">Líneas de acción por proyecto</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="lineas" name="Total" fill="#BEE3F8" radius={[4,4,0,0]} />
                <Bar dataKey="completadas" name="Completadas" fill="#1B2A4A" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
          {(['pendiente','en_proceso','bloqueado','vencido','completado'] as EstadoItem[]).map(e => (
            <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
          ))}
        </select>
        <select value={filtroPatrocinador} onChange={e => setFiltroPatrocinador(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los patrocinadores</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
        </select>
        <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* Tabla */}
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
                  <th className="px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Líneas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-[#F0F4F8] transition-colors">
                    <td className="px-4 py-3.5 font-medium text-[#1B2A4A]">{p.nombre}</td>
                    <td className="px-4 py-3.5"><StatusBadge estado={p.estadoReal} /></td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">
                      {(p.patrocinador as any) ? `${(p.patrocinador as any).apellido}, ${(p.patrocinador as any).nombre}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{formatDate(p.fecha_inicio)}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{formatDate(p.fecha_fin)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {((p.lineas_accion as any[]) ?? []).map((l: any) => (
                          <span key={l.id} className={`text-xs px-2 py-0.5 rounded-full ${
                            l.estado === 'completado' ? 'bg-green-100 text-green-700' :
                            l.estado === 'bloqueado' || l.estado === 'vencido' ? 'bg-red-100 text-red-700' :
                            'bg-[#EBF8FF] text-[#2B6CB0]'}`}>
                            {l.nombre}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
