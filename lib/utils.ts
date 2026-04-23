import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { EstadoItem } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null): string {
  if (!date) return '-'
  return new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

export function calcularEstadoReal(estado: EstadoItem, fechaFin: string): EstadoItem {
  if (estado === 'completado') return estado
  if (new Date(fechaFin + 'T23:59:59') < new Date()) return 'vencido'
  return estado
}

export function calcularEstadoProyecto(estados: EstadoItem[]): EstadoItem {
  if (estados.length === 0) return 'pendiente'
  if (estados.some(e => e === 'vencido')) return 'vencido'
  if (estados.some(e => e === 'bloqueado')) return 'bloqueado'
  if (estados.every(e => e === 'completado')) return 'completado'
  if (estados.every(e => e === 'pendiente')) return 'pendiente'
  return 'en_proceso'
}

export function isVencido(fechaFin: string, estado: EstadoItem): boolean {
  if (estado === 'completado') return false
  return new Date(fechaFin + 'T23:59:59') < new Date()
}
