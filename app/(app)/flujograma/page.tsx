'use client'

import { useEffect, useState, useRef } from 'react'
import { Printer, ChevronDown, ChevronRight } from 'lucide-react'
import { Proyecto, EstadoItem } from '@/lib/types'
import { formatDate, calcularEstadoReal, calcularEstadoProyecto } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import Btn from '@/components/shared/Btn'

const NRO_LINEA = ['I', 'II', 'III']

const ESTADO_BORDER: Record<EstadoItem, string> = {
  pendiente:  'border-amber-300 bg-amber-50',
  en_proceso: 'border-blue-300 bg-blue-50',
  bloqueado:  'border-red-400 bg-red-50',
  vencido:    'border-red-600 bg-red-100',
  completado: 'border-green-400 bg-green-50',
}

export default function FlujogramaPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [tareasExpandidas, setTareasExpandidas] = useState<Set<string>>(new Set())
  const [tareasMap, setTareasMap] = useState<Record<string, any[]>>({})
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/proyectos').then(r => r.json()).then(data => {
      const p = Array.isArray(data) ? data : []
      setProyectos(p)
      setSeleccionados(p.map((x: Proyecto) => x.id))
      setLoading(false)
    })
  }, [])

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

  function toggleProyecto(id: string) {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function exportarPDF() {
    window.print()
  }

  const proyectosFiltrados = proyectos.filter(p => seleccionados.includes(p.id))

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #flujograma-print, #flujograma-print * { visibility: visible; }
          #flujograma-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div>
        <div className="flex items-start justify-between mb-1 no-print">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">Flujograma</h1>
            <p className="text-gray-400 text-sm">Visualización de proyectos y sus líneas de acción</p>
          </div>
          <Btn variant="secondary" size="sm" onClick={exportarPDF}>
            <Printer size={14} />Exportar PDF
          </Btn>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 mt-4 no-print">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#1B2A4A]">Filtrar proyectos</p>
            <div className="flex gap-2">
              <button onClick={() => setSeleccionados(proyectos.map(p => p.id))}
                className="text-xs text-[#2B6CB0] hover:underline">Todos</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setSeleccionados([])}
                className="text-xs text-gray-400 hover:underline">Ninguno</button>
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
          <div className="text-center py-16 text-gray-400">Seleccioná al menos un proyecto</div>
        ) : (
          <div id="flujograma-print" className="space-y-8">
            <div className="hidden print:block mb-6">
              <h1 className="text-2xl font-bold text-[#1B2A4A]">SIAP — Sistema Administración Proyectos · Flujograma</h1>
              <p className="text-sm text-gray-400">Ministerio de Economía — República Argentina — {new Date().toLocaleDateString('es-AR')}</p>
            </div>

            {proyectosFiltrados.map(p => {
              const lineas = [...((p.lineas_accion as any[]) ?? [])].sort((a, b) => a.orden - b.orden)
              const estadosLineas = lineas.map((l: any) => calcularEstadoReal(l.estado, l.fecha_fin))
              const estadoProyecto = lineas.length > 0 ? calcularEstadoProyecto(estadosLineas) : p.estado
              const completadas = lineas.filter((l: any) => calcularEstadoReal(l.estado, l.fecha_fin) === 'completado').length

              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="mb-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <h2 className="text-lg font-bold text-[#1B2A4A]">{p.nombre}</h2>
                      <StatusBadge estado={estadoProyecto} fechaFin={p.fecha_fin} size="md" />
                    </div>
                    <div className="flex items-center gap-4 mt-1 flex-wrap text-xs text-gray-400">
                      <span>{formatDate(p.fecha_inicio)} → {formatDate(p.fecha_fin)}</span>
                      {(p.patrocinador as any) && (
                        <span>Patrocinador: {(p.patrocinador as any).apellido}, {(p.patrocinador as any).nombre}</span>
                      )}
                    </div>
                    {(p.descripcion || p.metrica_exito) && (
                      <div className="mt-3 grid md:grid-cols-2 gap-3">
                        {p.descripcion && (
                          <div className="bg-[#F0F4F8] rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-[#1B2A4A] mb-0.5">Descripción</p>
                            <p className="text-xs text-gray-600">{p.descripcion}</p>
                          </div>
                        )}
                        {p.metrica_exito && (
                          <div className="bg-[#F0F4F8] rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-[#1B2A4A] mb-0.5">Variable de éxito</p>
                            <p className="text-xs text-gray-600">{p.metrica_exito}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {lineas.length === 0 ? (
                    <p className="text-gray-300 text-sm italic">Sin líneas de acción</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3 mt-2">
                      {lineas.map((l: any) => {
                        const er = calcularEstadoReal(l.estado, l.fecha_fin)
                        const nro = NRO_LINEA[l.orden - 1] ?? l.orden
                        return (
                          <div key={l.id} className={`rounded-xl border-2 p-4 ${ESTADO_BORDER[er] ?? 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
                                Línea {nro}
                              </span>
                              <StatusBadge estado={er} size="sm" />
                            </div>
                            <h3 className="font-semibold text-[#1B2A4A] text-sm mb-1">{l.nombre}</h3>
                            {l.descripcion && <p className="text-xs text-gray-500 mb-1">{l.descripcion}</p>}
                            {l.metrica_exito && <p className="text-xs text-gray-400 italic mb-2">✓ {l.metrica_exito}</p>}
                            <div className="space-y-1 mt-2">
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
                              <div className="text-xs text-gray-500">{formatDate(l.fecha_inicio)} → {formatDate(l.fecha_fin)}</div>
                            </div>
                            <button
                              onClick={() => toggleTareas(l.id)}
                              className="mt-3 flex items-center gap-1 text-xs text-[#2B6CB0] hover:underline no-print">
                              {tareasExpandidas.has(l.id) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                              Tareas
                            </button>
                            {tareasExpandidas.has(l.id) && (
                              <div className="mt-2 space-y-1">
                                {(tareasMap[l.id] ?? []).length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">Sin tareas</p>
                                ) : (tareasMap[l.id] ?? []).map((t: any) => (
                                  <div key={t.id} className="flex items-start gap-2 bg-white/70 rounded-lg px-2 py-1.5">
                                    <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                      t.estado === 'completado' ? 'bg-green-500' :
                                      t.estado === 'bloqueado' ? 'bg-red-500' :
                                      t.estado === 'en_proceso' ? 'bg-blue-500' : 'bg-amber-400'
                                    }`}/>
                                    <span className="text-xs text-gray-700 leading-tight">{t.nombre}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {lineas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span>{completadas}/{lineas.length} líneas completadas</span>
                        <span>{Math.round((completadas / lineas.length) * 100)}%</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-1.5">
                        <div className="bg-[#1B2A4A] h-1.5 rounded-full"
                          style={{ width: `${(completadas / lineas.length) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
