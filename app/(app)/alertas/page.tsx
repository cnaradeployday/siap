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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/proyectos').then(r => r.json()).then(data => {
      setProyectos(Array.isArray(data) ? data : [])
      setLoading(false)
    })
  }, [])

  const proyectosConEstado = proyectos.map(p => {
    const lineas = (p.lineas_accion as any[]) ?? []
    const estadoReal = lineas.length > 0
      ? calcularEstadoProyecto(lineas.map((l: any) => calcularEstadoReal(l.estado, l.fecha_fin)))
      : p.estado
    return { ...p, estadoReal, dias: diasHastaFin(p.fecha_fin) }
  })

  const demorados = proyectosConEstado
    .filter(p => p.dias < 0 && p.estadoReal !== 'completado')
    .sort((a, b) => a.dias - b.dias)

  const proximos = proyectosConEstado
    .filter(p => p.dias >= 0 && p.dias <= 15 && p.estadoReal !== 'completado')
    .sort((a, b) => a.dias - b.dias)

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
              const lineasDemoradas = lineas.filter((l: any) =>
                calcularEstadoReal(l.estado, l.fecha_fin) === 'vencido'
              )
              return (
                <div key={p.id} className="bg-white rounded-xl border border-red-100 overflow-hidden">
                  <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {Math.abs(p.dias)} día{Math.abs(p.dias) !== 1 ? 's' : ''} demorado
                        </span>
                        <StatusBadge estado={p.estadoReal} size="sm" />
                      </div>
                      <h3 className="font-bold text-[#1B2A4A] text-sm leading-snug mb-1">{p.nombre}</h3>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        <span>Fecha límite: <span className="font-medium">{formatDate(p.fecha_fin)}</span></span>
                        {(p.patrocinador as any) && (
                          <span>Líder: <span className="font-medium text-gray-700">{(p.patrocinador as any).apellido}, {(p.patrocinador as any).nombre}</span></span>
                        )}
                      </div>
                      {lineasDemoradas.length > 0 && (
                        <div className="mt-2.5 space-y-1 pl-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Líneas demoradas</p>
                          {lineasDemoradas.map((l: any) => (
                            <div key={l.id} className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                              <span>{l.nombre}</span>
                              {l.responsable && (
                                <span className="text-gray-400">— {l.responsable.apellido}, {l.responsable.nombre}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => notificar(p)}
                      className="flex items-center gap-1.5 text-xs bg-[#1B2A4A] hover:bg-[#2B6CB0] text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      <Mail size={12} />Notificar
                    </button>
                  </div>
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
              const lineasPendientes = lineas.filter((l: any) =>
                calcularEstadoReal(l.estado, l.fecha_fin) !== 'completado'
              )
              return (
                <div key={p.id} className="bg-white rounded-xl border border-amber-100 overflow-hidden">
                  <div className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                          {p.dias === 0 ? 'Vence hoy' : `${p.dias} día${p.dias !== 1 ? 's' : ''} restante${p.dias !== 1 ? 's' : ''}`}
                        </span>
                        <StatusBadge estado={p.estadoReal} size="sm" />
                      </div>
                      <h3 className="font-bold text-[#1B2A4A] text-sm leading-snug mb-1">{p.nombre}</h3>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
                        <span>Vence: <span className="font-medium">{formatDate(p.fecha_fin)}</span></span>
                        {(p.patrocinador as any) && (
                          <span>Líder: <span className="font-medium text-gray-700">{(p.patrocinador as any).apellido}, {(p.patrocinador as any).nombre}</span></span>
                        )}
                      </div>
                      {lineasPendientes.length > 0 && (
                        <div className="mt-2.5 space-y-1 pl-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Líneas pendientes</p>
                          {lineasPendientes.map((l: any) => (
                            <div key={l.id} className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                              <span>{l.nombre}</span>
                              {l.responsable && (
                                <span className="text-gray-400">— {l.responsable.apellido}, {l.responsable.nombre}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => notificar(p)}
                      className="flex items-center gap-1.5 text-xs bg-[#1B2A4A] hover:bg-[#2B6CB0] text-white px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      <Mail size={12} />Notificar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
