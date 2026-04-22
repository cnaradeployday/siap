'use client'

import { useEffect, useState } from 'react'
import { Proyecto, EstadoItem, ESTADO_LABELS } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'

const ESTADO_BG: Record<EstadoItem, string> = {
  pendiente: 'border-amber-300 bg-amber-50',
  en_proceso: 'border-blue-300 bg-blue-50',
  bloqueado: 'border-red-400 bg-red-50',
  vencido: 'border-red-600 bg-red-100',
  completado: 'border-green-400 bg-green-50',
}

export default function FlujogramaPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionados, setSeleccionados] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/proyectos').then(r => r.json()).then(data => {
      const p = Array.isArray(data) ? data : []
      setProyectos(p)
      setSeleccionados(p.map((x: Proyecto) => x.id))
      setLoading(false)
    })
  }, [])

  function toggleProyecto(id: string) {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAll() { setSeleccionados(proyectos.map(p => p.id)) }
  function clearAll() { setSeleccionados([]) }

  const proyectosFiltrados = proyectos.filter(p => seleccionados.includes(p.id))

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-1">Flujograma</h1>
      <p className="text-gray-400 text-sm mb-6">Visualización de proyectos y sus líneas de acción</p>

      {/* Filtro multiselect */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#1B2A4A]">Filtrar proyectos</p>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-[#2B6CB0] hover:underline">Todos</button>
            <span className="text-gray-300">|</span>
            <button onClick={clearAll} className="text-xs text-gray-400 hover:underline">Ninguno</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {proyectos.map(p => (
            <button key={p.id} onClick={() => toggleProyecto(p.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                seleccionados.includes(p.id)
                  ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#2B6CB0]'
              }`}>
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : proyectosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Seleccioná al menos un proyecto para visualizar</div>
      ) : (
        <div className="space-y-8">
          {proyectosFiltrados.map(p => {
            const lineas = (p.lineas_accion as any[]) ?? []
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-6">
                {/* Proyecto header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#1B2A4A]">{p.nombre}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <StatusBadge estado={p.estado} />
                      <span className="text-xs text-gray-400">{formatDate(p.fecha_inicio)} → {formatDate(p.fecha_fin)}</span>
                      {(p.patrocinador as any) && (
                        <span className="text-xs text-gray-400">
                          Patrocinador: {(p.patrocinador as any).apellido}, {(p.patrocinador as any).nombre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Líneas de acción */}
                {lineas.length === 0 ? (
                  <p className="text-gray-300 text-sm italic">Sin líneas de acción</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {lineas.map((l: any, idx: number) => (
                      <div key={l.id} className={`rounded-xl border-2 p-4 ${ESTADO_BG[l.estado as EstadoItem] ?? 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
                            Línea {['I','II','III'][idx] ?? idx+1}
                          </span>
                          <StatusBadge estado={l.estado} size="sm" />
                        </div>
                        <h3 className="font-semibold text-[#1B2A4A] text-sm mb-3">{l.nombre}</h3>
                        <div className="space-y-1.5">
                          {l.responsable && (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[#1B2A4A] flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[8px] font-bold">
                                  {l.responsable.nombre[0]}{l.responsable.apellido[0]}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600">{l.responsable.apellido}, {l.responsable.nombre}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {formatDate(l.fecha_inicio)} → {formatDate(l.fecha_fin)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Flecha visual entre proyecto y líneas */}
                {lineas.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-300">
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                      <span>{lineas.filter((l: any) => l.estado === 'completado').length}/{lineas.length} líneas completadas</span>
                      <div className="flex-1 border-t border-dashed border-gray-200" />
                    </div>
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#1B2A4A] h-1.5 rounded-full transition-all"
                        style={{ width: `${lineas.length ? (lineas.filter((l: any) => l.estado === 'completado').length / lineas.length) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
