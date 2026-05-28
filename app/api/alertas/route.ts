import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const vencidoCutoff = new Date(today)
  vencidoCutoff.setDate(vencidoCutoff.getDate() - 1) // fecha_fin < hoy (vencidas)

  const porVencerCutoff = new Date(today)
  porVencerCutoff.setDate(porVencerCutoff.getDate() + 15) // fecha_fin <= hoy+15

  const todayStr = today.toISOString().split('T')[0]
  const porVencerStr = porVencerCutoff.toISOString().split('T')[0]

  const select = `
    id, nombre, fecha_fin, estado,
    responsable:usuarios!tareas_responsable_id_fkey(id,nombre,apellido),
    linea:lineas_accion!tareas_linea_id_fkey(
      id, nombre,
      proyecto:proyectos!lineas_accion_proyecto_id_fkey(id, nombre)
    )
  `

  // Tareas vencidas: fecha_fin < hoy y no completadas
  const { data: vencidas } = await supabaseAdmin
    .from('tareas')
    .select(select)
    .lt('fecha_fin', todayStr)
    .not('estado', 'eq', 'completado')
    .is('deleted_at', null)
    .order('fecha_fin', { ascending: true })

  // Tareas por vencer: fecha_fin entre hoy y hoy+15 y no completadas
  const { data: porVencer } = await supabaseAdmin
    .from('tareas')
    .select(select)
    .gte('fecha_fin', todayStr)
    .lte('fecha_fin', porVencerStr)
    .not('estado', 'eq', 'completado')
    .is('deleted_at', null)
    .order('fecha_fin', { ascending: true })

  return NextResponse.json({ vencidas: vencidas ?? [], porVencer: porVencer ?? [] })
}
