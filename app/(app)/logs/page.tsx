'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/shared/PageHeader'

const TABLAS = ['proyectos','lineas_accion','tareas','usuarios','roles','requerimientos']
const ACCIONES = ['INSERT','UPDATE','DELETE']
const TABLA_LABELS: Record<string,string> = {
  proyectos: 'Proyectos', lineas_accion: 'Líneas de Acción',
  tareas: 'Tareas', usuarios: 'Usuarios', roles: 'Roles', requerimientos: 'Requerimientos'
}

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filtroTabla, setFiltroTabla] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [page, setPage] = useState(1)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => { fetchLogs() }, [filtroTabla, filtroAccion, page])

  async function fetchLogs() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (filtroTabla) params.set('tabla', filtroTabla)
    if (filtroAccion) params.set('accion', filtroAccion)
    const res = await fetch(`/api/logs?${params}`)
    const data = await res.json()
    setLogs(data.data ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }

  const accionColor = (accion: string) => ({
    INSERT: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  }[accion] ?? 'bg-gray-100 text-gray-600')

  function formatTimestamp(ts: string) {
    return new Date(ts).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      <PageHeader title="Log de Auditoría" description="Registro de todas las acciones realizadas en el sistema" />

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <select value={filtroTabla} onChange={e => { setFiltroTabla(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todas las secciones</option>
          {TABLAS.map(t => <option key={t} value={t}>{TABLA_LABELS[t] ?? t}</option>)}
        </select>
        <select value={filtroAccion} onChange={e => { setFiltroAccion(e.target.value); setPage(1) }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todas las acciones</option>
          {ACCIONES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{total} registro{total !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Sin registros de auditoría</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4F8] border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Fecha y hora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Sección</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Acción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log, i) => (
                  <>
                    <tr key={log.id} className={`hover:bg-[#F0F4F8] ${i % 2 === 0 ? '' : 'bg-[#FAFAFA]'}`}>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono whitespace-nowrap">{formatTimestamp(log.created_at)}</td>
                      <td className="px-4 py-3 text-[#1B2A4A] text-xs">
                        {log.usuario ? `${log.usuario.apellido}, ${log.usuario.nombre}` : <span className="text-gray-300 italic">Sistema</span>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="bg-[#EBF8FF] text-[#2B6CB0] px-2 py-0.5 rounded-full">
                          {TABLA_LABELS[log.tabla] ?? log.tabla}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${accionColor(log.accion)}`}>
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                          className="text-xs text-[#2B6CB0] hover:underline">
                          {expandido === log.id ? 'Ocultar' : 'Ver cambios'}
                        </button>
                      </td>
                    </tr>
                    {expandido === log.id && (
                      <tr key={log.id + '_d'} className="bg-gray-50">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap bg-white border border-gray-100 rounded-lg p-3 max-h-64">
                            {JSON.stringify(log.cambios, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-sm text-[#2B6CB0] disabled:text-gray-300 hover:underline">← Anterior</button>
            <span className="text-xs text-gray-400">Página {page} de {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-sm text-[#2B6CB0] disabled:text-gray-300 hover:underline">Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  )
}
