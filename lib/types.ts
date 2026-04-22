export type EstadoItem = 'pendiente' | 'en_proceso' | 'bloqueado' | 'vencido' | 'completado'

export interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface PermisoRol {
  id: string
  rol_id: string
  seccion: string
  puede_leer: boolean
  puede_escribir: boolean
}

export interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string | null
  auth_user_id: string | null
  rol_id: string | null
  is_admin: boolean
  activo: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
  rol?: Rol
}

export interface Proyecto {
  id: string
  nombre: string
  descripcion: string | null
  metrica_exito: string | null
  patrocinador_id: string | null
  fecha_inicio: string
  fecha_fin: string
  estado: EstadoItem
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  patrocinador?: Usuario
  lineas_accion?: LineaAccion[]
}

export interface LineaAccion {
  id: string
  proyecto_id: string
  nombre: string
  descripcion: string | null
  metrica_exito: string | null
  responsable_id: string | null
  patrocinador_id: string | null
  fecha_inicio: string
  fecha_fin: string
  estado: EstadoItem
  orden: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  responsable?: Usuario
  patrocinador?: Usuario
  proyecto?: Proyecto
  tareas?: Tarea[]
}

export interface Tarea {
  id: string
  linea_id: string
  nombre: string
  descripcion: string | null
  metrica_exito: string | null
  responsable_id: string | null
  fecha_inicio: string
  duracion_dias: number
  fecha_fin: string
  estado: EstadoItem
  orden: number
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  responsable?: Usuario
  linea?: LineaAccion
  subtareas?: Subtarea[]
  dependencias?: DependenciaTarea[]
}

export interface Subtarea {
  id: string
  tarea_id: string
  nombre: string
  descripcion: string | null
  metrica_exito: string | null
  responsable_id: string | null
  fecha_inicio: string
  duracion_dias: number
  fecha_fin: string
  estado: EstadoItem
  orden: number
  depende_de_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  responsable?: Usuario
}

export interface DependenciaTarea {
  id: string
  tarea_id: string
  depende_de_id: string
  created_at: string
  depende_de?: Tarea
}

export interface Comentario {
  id: string
  tarea_id: string | null
  subtarea_id: string | null
  usuario_id: string
  texto: string
  created_at: string
  usuario?: Usuario
}

export interface LogAuditoria {
  id: string
  tabla: string
  registro_id: string | null
  usuario_id: string | null
  accion: 'INSERT' | 'UPDATE' | 'DELETE'
  cambios: Record<string, unknown> | null
  created_at: string
  usuario?: Usuario
}

export const SECCIONES = [
  'dashboard_directivo',
  'dashboard_ejecutivo', 
  'flujograma',
  'proyectos',
  'lineas_accion',
  'tareas',
  'usuarios',
  'roles',
] as const

export type Seccion = typeof SECCIONES[number]

export const ESTADO_LABELS: Record<EstadoItem, string> = {
  pendiente: 'Pendiente de iniciar',
  en_proceso: 'En proceso',
  bloqueado: 'Bloqueado',
  vencido: 'Vencido',
  completado: 'Completado',
}

export const ESTADO_COLORS: Record<EstadoItem, { bg: string; text: string; dot: string }> = {
  pendiente:  { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500'  },
  en_proceso: { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  bloqueado:  { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
  vencido:    { bg: 'bg-red-200',    text: 'text-red-900',    dot: 'bg-red-700'    },
  completado: { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
}
