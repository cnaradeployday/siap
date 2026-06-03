'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock, Mail } from 'lucide-react'
import { formatDate, calcularEstadoReal, calcularEstadoProyecto } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'

function diasHastaFin(fechaFin: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fin = new Date(fechaFin + 'T00:00:00')
  return Math.round((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export default function AlertasPage() {
  const [proyectos, setProyectos] = useState<any[]>([])
  const [tareasMap, setTareasMap] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/proyectos').then(r => r.json()).then(async (data: any[]) => {
      const ps = Array.isArray(data) ? data : []
      setProyectos(ps)

      // Calcular estadoReal para cada proyecto y cargar tareas de líneas demoradas
      const lineasDemoradasIds: string[] = []
      for (const p of ps) {
        const lineas = (p.lineas_accion as any[]) ?? []
        for (const l of lineas) {
          if (calcularEstadoReal(l.estado, l.fecha_fin) === 'vencido') {
            lineasDemoradasIds.push(l.id)
          }
        }
      }

      if (lineasDemoradasIds.length > 0) {
        const results = await Promise.all(
          lineasDemoradasIds.map(id =>
            fetch(`/api/tareas?lineaId=${id}`).then(r => r.json()).then(t => ({ id, tareas: Array.isArray(t) ? t : [] }))
          )
        )
        const map: Record<string, any[]> = {}
        for (const { id, tareas } of results) map[id] = tareas
        setTareasMap(map)
      }

      setLoading(false)
    })
  }, [])

  const proyectosConEstado = proyectos.map(p => {
    const lineas = (p.lineas_accion as any[]) ?? []
    const estadoReal = lineas.length > 0
      ? calcularEstadoProyecto(lineas.map((l: any) => calcularEstadoReal(l.estado, l.fecha_fin)))
      : p.estado
    return { ...p, estadoReal, diasProyecto: diasHastaFin(p.fecha_fin) }
  })

  // Mismo criterio que Tablero Ejecutivo: estadoReal === 'vencido'
  const demorados = proyectosConEstado
    .filter(p => p.estadoReal === 'vencido')
    .sort((a, b) => a.diasProyecto - b.diasProyecto)

  // Próximos: no completado, no ya demorado, y el proyecto vence en ≤15 días
  const proximos = proyectosConEstado
    .filter(p => p.estadoReal !== 'completado' && p.estadoReal !== 'vencido' && p.diasProyecto >= 0 && p.diasProyecto <= 15)
    .sort((a, b) => a.diasProyecto - b.diasProyecto)

  function notificar(proyecto: any) {
    alert(`Notificación de demora para "${proyecto.nombre}"\n\nFuncionalidad de envío de email disponible próximamente.`)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-1">Alertas</h1>
      <p className="text-gray-400 text-sm mb-6">Proyectos demorados y próximos a vencer</p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-red-50 rounded-xl p-4">
          <span className="text-3xl font-bold text-red-700">{demorados.length}</span>
          <p className="text-xs mt-1 text-red-700 opacity-70">Proyectos demorados</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <span className="text-3xl font-bold text-amber-700">{proximos.length}</span>
          <p className="text-xs mt-1 text-amber-700 opacity-70">Próximos a demorarse (≤15 días)</p>
        </div>
      </div>

      {/* Demorados */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-red-500" />
          <h2 className="text-xs font-black text-[#1B2A4A] uppercase tracking-wider">Proyectos Demorados</h2>
        </div>
        {demorados.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No hay proyectos demorados
          </div>
        ) : (
          <div className="space-y-3">
            {demorados.map(p => {
              const lineas = (p.lineas_accion as any[]) ?? []
              const lineasDemoradas = lineas.filter((l: any) => calcularEstadoReal(l.estado, l.fecha_fin) === 'vencido')
              const diasDemorado = Math.abs(p.diasProyecto)
              return (
                <div key={p.id} className="bg-white rounded-xl border border-red-100">
                  <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {p.diasProyecto < 0 && (
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {diasDemorado} día{diasDemorado !== 1 ? 's' : ''} demorado
                          </span>
                        )}
                        <StatusBadge estado={p.estadoReal} size="sm" />
                      </div>
                      <h3 className="font-bold text-[#1B2A4A] text-sm leading-snug mb-1">{p.nombre}</h3>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        <span>Fecha límite: <span className="font-medium">{formatDate(p.fecha_fin)}</span></span>
                        {(p.patrocinador as any) && (
                          <span>Líder: <span className="font-medium text-gray-700">
                            {(p.patrocinador as any).apellido}, {(p.patrocinador as any).nombre}
                          </span></span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => notificar(p)}
                      className="flex items-center gap-1.5 text-xs bg-[#1B2A4A] hover:bg-[#2B6CB0] text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      <Mail size={12} />Notificar
                    </button>
                  </div>

                  {lineasDemoradas.length > 0 && (
                    <div className="border-t border-red-50 px-5 pb-4 pt-3 space-y-4">
                      {lineasDemoradas.map((l: any) => {
                        const tareas = tareasMap[l.id] ?? []
                        const diasLinea = Math.abs(diasHastaFin(l.fecha_fin))
                        return (
                          <div key={l.id}>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-[#1B2A4A]">{l.nombre}</span>
                              <span className="text-[10px] text-red-500 font-medium">{diasLinea} día{diasLinea !== 1 ? 's' : ''} demorada</span>
                              {l.responsable && (
                                <span className="text-[10px] text-gray-400">
                                  · {l.responsable.apellido}, {l.responsable.nombre}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400">
                                · {formatDate(l.fecha_inicio)} → {formatDate(l.fecha_fin)}
                              </span>
                            </div>
                            {tareas.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {tareas.map((t: any) => (
                                  <div key={t.id} className="flex items-center gap-2 flex-wrap text-[11px] text-gray-600 bg-red-50/50 rounded-lg px-3 py-1.5">
                                    <span className="flex-1 min-w-0">{t.nombre}</span>
                                    <StatusBadge estado={calcularEstadoReal(t.estado, t.fecha_fin)} size="sm" />
                                    <span className="text-gray-400 whitespace-nowrap">{formatDate(t.fecha_inicio)} → {formatDate(t.fecha_fin)}</span>
                                    {t.responsable && (
                                      <span className="text-gray-500 whitespace-nowrap">{t.responsable.apellido}, {t.responsable.nombre}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Próximos a demorarse */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} className="text-amber-500" />
          <h2 className="text-xs font-black text-[#1B2A4A] uppercase tracking-wider">Próximos a Demorarse</h2>
          <span className="text-xs text-gray-400 font-normal">vencen en ≤ 15 días</span>
        </div>
        {proximos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No hay proyectos próximos a vencer
          </div>
        ) : (
          <div className="space-y-3">
            {proximos.map(p => {
              const lineas = (p.lineas_accion as any[]) ?? []
              const lineasPendientes = lineas.filter((l: any) => calcularEstadoReal(l.estado, l.fecha_fin) !== 'completado')
              return (
                <div key={p.id} className="bg-white rounded-xl border border-amber-100">
                  <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {p.diasProyecto === 0 ? 'Vence hoy' : `${p.diasProyecto} día${p.diasProyecto !== 1 ? 's' : ''} restante${p.diasProyecto !== 1 ? 's' : ''}`}
                        </span>
                        <StatusBadge estado={p.estadoReal} size="sm" />
                      </div>
                      <h3 className="font-bold text-[#1B2A4A] text-sm leading-snug mb-1">{p.nombre}</h3>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        <span>Vence: <span className="font-medium">{formatDate(p.fecha_fin)}</span></span>
                        {(p.patrocinador as any) && (
                          <span>Líder: <span className="font-medium text-gray-700">
                            {(p.patrocinador as any).apellido}, {(p.patrocinador as any).nombre}
                          </span></span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => notificar(p)}
                      className="flex items-center gap-1.5 text-xs bg-[#1B2A4A] hover:bg-[#2B6CB0] text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      <Mail size={12} />Notificar
                    </button>
                  </div>
                  {lineasPendientes.length > 0 && (
                    <div className="border-t border-amber-50 px-5 pb-4 pt-3 space-y-1">
                      {lineasPendientes.map((l: any) => (
                        <div key={l.id} className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <span>{l.nombre}</span>
                          {l.responsable && <span className="text-gray-400">· {l.responsable.apellido}, {l.responsable.nombre}</span>}
                          <span className="text-gray-400">· {formatDate(l.fecha_inicio)} → {formatDate(l.fecha_fin)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
