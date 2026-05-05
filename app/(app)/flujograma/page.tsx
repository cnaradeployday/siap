'use client'

import { useEffect, useState, useRef } from 'react'
import { Printer, ChevronDown, ChevronRight } from 'lucide-react'
import { Proyecto, EstadoItem, Usuario } from '@/lib/types'
import { formatDate, calcularEstadoReal, calcularEstadoProyecto } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'
import Btn from '@/components/shared/Btn'

const NRO_LINEA = ['I', 'II', 'III']

const ESTADO_BORDER: Record<EstadoItem, string> = {
  pendiente:  'border-gray-300 bg-gray-50',
  en_proceso: 'border-blue-300 bg-blue-50',
  bloqueado:  'border-red-400 bg-red-50',
  vencido:    'border-red-400 bg-red-50',
  completado: 'border-green-400 bg-green-50',
}

const ESTADO_HEADER: Record<EstadoItem, string> = {
  pendiente:  'bg-gray-400',
  en_proceso: 'bg-blue-500',
  bloqueado:  'bg-red-500',
  vencido:    'bg-red-500',
  completado: 'bg-green-500',
}

export default function FlujogramaPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [filtroPatrocinador, setFiltroPatrocinador] = useState('')
  const [tareasExpandidas, setTareasExpandidas] = useState<Set<string>>(new Set())
  const [tareasMap, setTareasMap] = useState<Record<string, any[]>>({})

  useEffect(() => {
    fetch('/api/proyectos').then(r => r.json()).then(p => {
      const ps = Array.isArray(p) ? p : []
      setProyectos(ps)
      setSeleccionados([])
      setLoading(false)
    })
  }, [])

  const patrocinadores = proyectos
    .filter(p => p.patrocinador_id && (p.patrocinador as any))
    .map(p => p.patrocinador as any)
    .filter((u, i, arr) => arr.findIndex((x: any) => x.id === u.id) === i)
    .sort((a: any, b: any) => a.apellido.localeCompare(b.apellido))

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

  const proyectosFiltrados = proyectos
    .filter(p => seleccionados.includes(p.id))
    .filter(p => !filtroPatrocinador || p.patrocinador_id === filtroPatrocinador)

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #flujograma-print, #flujograma-print * { visibility: visible; }
          #flujograma-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-page-break { page-break-after: always; }
        }
      `}</style>

      <div>
        <div className="flex items-start justify-between mb-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">Flujograma</h1>
            <p className="text-gray-400 text-sm">Visualización de proyectos y sus líneas de acción</p>
          </div>
          <Btn variant="secondary" size="sm" onClick={exportarPDF}>
            <Printer size={14} />Exportar PDF
          </Btn>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 no-print">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-[#1B2A4A]">Proyectos</p>
              <div className="flex gap-2">
                <button onClick={() => setSeleccionados(proyectos.filter(p => !filtroPatrocinador || p.patrocinador_id === filtroPatrocinador).map(p => p.id))}
                  className="text-xs text-[#2B6CB0] hover:underline font-medium">Todos</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => setSeleccionados([])}
                  className="text-xs text-gray-400 hover:underline">Ninguno</button>
              </div>
            </div>
            <select value={filtroPatrocinador} onChange={e => setFiltroPatrocinador(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
              <option value="">Todos los patrocinadores</option>
              {patrocinadores.map((u: any) => (
                <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {proyectos
              .filter(p => !filtroPatrocinador || p.patrocinador_id === filtroPatrocinador)
              .map(p => {
                const lineas = (p.lineas_accion as any[]) ?? []
                const estados = lineas.map((l: any) => calcularEstadoReal(l.estado, l.fecha_fin))
                const estado = lineas.length > 0 ? calcularEstadoProyecto(estados) : p.estado
                const isSelected = seleccionados.includes(p.id)
                return (
                  <button key={p.id} onClick={() => toggleProyecto(p.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#2B6CB0] hover:text-[#2B6CB0]'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      estado === 'completado' ? 'bg-green-400' :
                      estado === 'bloqueado' || estado === 'vencido' ? 'bg-red-400' :
                      estado === 'en_proceso' ? 'bg-blue-400' : 'bg-gray-400'
                    } ${isSelected ? 'opacity-70' : ''}`} />
                    {p.nombre}
                  </button>
                )
              })}
          </div>
          {seleccionados.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">{seleccionados.length} proyecto{seleccionados.length !== 1 ? 's' : ''} seleccionado{seleccionados.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : seleccionados.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium text-gray-500">Seleccioná un proyecto para visualizarlo</p>
            <p className="text-sm mt-1">Usá los filtros de arriba para elegir qué proyectos mostrar</p>
          </div>
        ) : proyectosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No hay proyectos que coincidan con el filtro</div>
        ) : (
          <div id="flujograma-print" className="space-y-0">
            {proyectosFiltrados.map((p, idx) => {
              const lineas = [...((p.lineas_accion as any[]) ?? [])].sort((a, b) => a.orden - b.orden)
              const estadosLineas = lineas.map((l: any) => calcularEstadoReal(l.estado, l.fecha_fin))
              const estadoProyecto = lineas.length > 0 ? calcularEstadoProyecto(estadosLineas) : p.estado

              return (
                <div key={p.id} className={`print-page-break ${idx > 0 ? 'mt-8 print:mt-0' : ''}`}>
                  {/* Header impresión por proyecto */}
                  <div className="hidden print:flex print:items-center print:justify-between print:mb-6 print:pb-3 print:border-b-2 print:border-[#1B2A4A]">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Sistema Administración Proyectos</p>
                      <h1 className="text-xl font-bold text-[#1B2A4A]">Flujograma</h1>
                    </div>
                    <img src="/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Header del proyecto coloreado */}
                    <div className={`${ESTADO_HEADER[estadoProyecto] ?? 'bg-gray-400'} px-6 py-4`}>
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-wider font-medium mb-0.5">Proyecto</p>
                          <h2 className="text-xl font-bold text-white leading-tight">{p.nombre}</h2>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                            {estadoProyecto === 'en_proceso' ? 'En proceso' :
                             estadoProyecto === 'completado' ? 'Completado' :
                             estadoProyecto === 'bloqueado' ? 'Bloqueado' :
                             estadoProyecto === 'vencido' ? 'Demorado' : 'Pendiente'}
                          </span>
                          <span className="text-white/60 text-xs">{formatDate(p.fecha_inicio)} → {formatDate(p.fecha_fin)}</span>
                        </div>
                      </div>
                      {(p.patrocinador as any) && (
                        <p className="text-white/70 text-xs mt-2">
                          Patrocinador: <span className="text-white font-medium">{(p.patrocinador as any).apellido}, {(p.patrocinador as any).nombre}</span>
                        </p>
                      )}
                    </div>

                    {/* Descripción y variable de éxito */}
                    {(p.descripcion || p.metrica_exito) && (
                      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 grid md:grid-cols-2 gap-4">
                        {p.descripcion && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Descripción</p>
                            <p className="text-sm text-gray-700">{p.descripcion}</p>
                          </div>
                        )}
                        {p.metrica_exito && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Variable de éxito</p>
                            <p className="text-sm text-gray-700">{p.metrica_exito}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Líneas */}
                    <div className="p-6">
                      {lineas.length === 0 ? (
                        <p className="text-gray-300 text-sm italic">Sin líneas de acción</p>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                          {lineas.map((l: any) => {
                            const er = calcularEstadoReal(l.estado, l.fecha_fin)
                            const nro = NRO_LINEA[l.orden - 1] ?? l.orden
                            return (
                              <div key={l.id} className={`rounded-xl border-2 overflow-hidden ${ESTADO_BORDER[er] ?? 'border-gray-200 bg-gray-50'}`}>
                                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                                  <span className="text-[10px] font-black text-[#1B2A4A] uppercase tracking-widest">LÍNEA {nro}</span>
                                  <StatusBadge estado={er} size="sm" />
                                </div>
                                <div className="px-4 pb-4">
                                  <h3 className="font-bold text-[#1B2A4A] text-sm mb-2 leading-snug">{l.nombre}</h3>
                                  {l.descripcion && <p className="text-xs text-gray-500 mb-1">{l.descripcion}</p>}
                                  {l.metrica_exito && (
                                    <p className="text-xs text-gray-400 italic mb-2 flex items-start gap-1">
                                      <span>✓</span><span>{l.metrica_exito}</span>
                                    </p>
                                  )}
                                  <div className="space-y-1.5 mt-3 pt-3 border-t border-black/5">
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
                                    <div className="text-xs text-gray-400">{formatDate(l.fecha_inicio)} → {formatDate(l.fecha_fin)}</div>
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
                                            t.estado === 'bloqueado' || calcularEstadoReal(t.estado, t.fecha_fin) === 'vencido' ? 'bg-red-500' :
                                            t.estado === 'en_proceso' ? 'bg-blue-500' : 'bg-gray-400'
                                          }`}/>
                                          <span className="text-xs text-gray-500 font-medium flex-shrink-0">{t.orden}.</span>
                                          <span className="text-xs text-gray-700 leading-tight">{t.nombre}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
