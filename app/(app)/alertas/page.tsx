'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import { formatDate } from '@/lib/utils'
import Btn from '@/components/shared/Btn'

interface TareaAlerta {
  id: string
  nombre: string
  fecha_fin: string
  estado: string
  responsable?: { id: string; nombre: string; apellido: string }
  linea?: { id: string; nombre: string; proyecto?: { id: string; nombre: string } }
}

interface AlertasData {
  vencidas: TareaAlerta[]
  porVencer: TareaAlerta[]
}

function diasRestantes(fechaFin: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fin = new Date(fechaFin + 'T12:00:00')
  const diff = Math.round((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function AlertasPage() {
  const [data, setData] = useState<AlertasData>({ vencidas: [], porVencer: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAlertas() }, [])

  async function fetchAlertas() {
    setLoading(true)
    const res = await fetch('/api/alertas')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  const totalAlertas = data.vencidas.length + data.porVencer.length

  return (
    <div>
      <PageHeader
        title="Alertas"
        description={`${totalAlertas} alerta${totalAlertas !== 1 ? 's' : ''} activa${totalAlertas !== 1 ? 's' : ''}`}
        action={<Btn variant="secondary" onClick={fetchAlertas}><RefreshCw size={15} />Actualizar</Btn>}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tareas vencidas */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-600" />
              <h2 className="text-base font-semibold text-red-700">
                Tareas Vencidas ({data.vencidas.length})
              </h2>
              <span className="text-xs text-gray-400">— fecha de vencimiento superada</span>
            </div>

            {data.vencidas.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                No hay tareas vencidas
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-red-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-red-50 border-b border-red-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-red-700 uppercase tracking-wider">Tarea</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-red-700 uppercase tracking-wider">Proyecto</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-red-700 uppercase tracking-wider">Responsable</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-red-700 uppercase tracking-wider">Vencimiento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-red-700 uppercase tracking-wider">Días vencida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {data.vencidas.map(t => {
                      const dias = Math.abs(diasRestantes(t.fecha_fin))
                      return (
                        <tr key={t.id} className="hover:bg-red-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-[#1B2A4A]">{t.nombre}</td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">
                            {t.linea?.proyecto?.nombre ?? '—'}
                            {t.linea && <span className="text-gray-400 ml-1">/ {t.linea.nombre}</span>}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {t.responsable ? `${t.responsable.nombre} ${t.responsable.apellido}` : <span className="text-gray-400 italic">Sin asignar</span>}
                          </td>
                          <td className="px-4 py-3.5 text-red-600 font-medium">{formatDate(t.fecha_fin)}</td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              {dias} día{dias !== 1 ? 's' : ''}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Tareas por vencer */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={18} className="text-amber-600" />
              <h2 className="text-base font-semibold text-amber-700">
                Tareas por Vencer ({data.porVencer.length})
              </h2>
              <span className="text-xs text-gray-400">— vencen en los próximos 15 días</span>
            </div>

            {data.porVencer.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                No hay tareas próximas a vencer
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-amber-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-amber-50 border-b border-amber-100">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wider">Tarea</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wider">Proyecto</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wider">Responsable</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wider">Vencimiento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-700 uppercase tracking-wider">Días restantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-50">
                    {data.porVencer.map(t => {
                      const dias = diasRestantes(t.fecha_fin)
                      const urgente = dias <= 5
                      return (
                        <tr key={t.id} className="hover:bg-amber-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-medium text-[#1B2A4A]">{t.nombre}</td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">
                            {t.linea?.proyecto?.nombre ?? '—'}
                            {t.linea && <span className="text-gray-400 ml-1">/ {t.linea.nombre}</span>}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {t.responsable ? `${t.responsable.nombre} ${t.responsable.apellido}` : <span className="text-gray-400 italic">Sin asignar</span>}
                          </td>
                          <td className="px-4 py-3.5 text-amber-700 font-medium">{formatDate(t.fecha_fin)}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${urgente ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                              {dias} día{dias !== 1 ? 's' : ''}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
