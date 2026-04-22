'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import Btn from '@/components/shared/Btn'
import FormField from '@/components/shared/FormField'
import Input from '@/components/shared/Input'
import Textarea from '@/components/shared/Textarea'
import { Rol, SECCIONES } from '@/lib/types'

const SECCION_LABELS: Record<string, string> = {
  dashboard_directivo: 'Dashboard Directivo',
  dashboard_ejecutivo: 'Dashboard Ejecutivo',
  flujograma: 'Flujograma',
  proyectos: 'Proyectos',
  lineas_accion: 'Líneas de Acción',
  tareas: 'Tareas',
  usuarios: 'Usuarios',
  roles: 'Roles',
}

type PermisoLocal = { seccion: string; puede_leer: boolean; puede_escribir: boolean }

export default function RolesPage() {
  const [roles, setRoles] = useState<(Rol & { permisos: PermisoLocal[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<(Rol & { permisos: PermisoLocal[] }) | null>(null)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [permisos, setPermisos] = useState<PermisoLocal[]>(
    SECCIONES.map(s => ({ seccion: s, puede_leer: false, puede_escribir: false }))
  )

  useEffect(() => { fetchRoles() }, [])

  async function fetchRoles() {
    setLoading(true)
    const data = await fetch('/api/roles').then(r => r.json())
    setRoles(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openNuevo() {
    setEditando(null)
    setNombre('')
    setDescripcion('')
    setPermisos(SECCIONES.map(s => ({ seccion: s, puede_leer: false, puede_escribir: false })))
    setModalOpen(true)
  }

  function openEditar(r: Rol & { permisos: PermisoLocal[] }) {
    setEditando(r)
    setNombre(r.nombre)
    setDescripcion(r.descripcion ?? '')
    setPermisos(SECCIONES.map(s => {
      const p = r.permisos?.find(p => p.seccion === s)
      return { seccion: s, puede_leer: p?.puede_leer ?? false, puede_escribir: p?.puede_escribir ?? false }
    }))
    setModalOpen(true)
  }

  function setPermiso(seccion: string, campo: 'puede_leer' | 'puede_escribir', valor: boolean) {
    setPermisos(prev => prev.map(p => {
      if (p.seccion !== seccion) return p
      if (campo === 'puede_escribir' && valor) return { ...p, puede_leer: true, puede_escribir: true }
      if (campo === 'puede_leer' && !valor) return { ...p, puede_leer: false, puede_escribir: false }
      return { ...p, [campo]: valor }
    }))
  }

  async function handleSave() {
    if (!nombre.trim()) return
    setSaving(true)
    const url = editando ? `/api/roles/${editando.id}` : '/api/roles'
    const method = editando ? 'PATCH' : 'POST'
    await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion, permisos })
    })
    await fetchRoles()
    setModalOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este rol? Los usuarios con este rol quedarán sin rol asignado.')) return
    await fetch(`/api/roles/${id}`, { method: 'DELETE' })
    await fetchRoles()
  }

  return (
    <div>
      <PageHeader title="Roles y Permisos"
        description="Configurá perfiles de acceso y asignalos a usuarios"
        action={<Btn onClick={openNuevo}><Plus size={16} />Nuevo Rol</Btn>} />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState title="Sin roles" description="Creá el primer perfil de acceso"
          action={<Btn onClick={openNuevo} size="sm"><Plus size={14} />Nuevo Rol</Btn>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-[#1B2A4A]">{r.nombre}</h3>
                  {r.descripcion && <p className="text-xs text-gray-400 mt-0.5">{r.descripcion}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditar(r)}
                    className="p-1.5 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {SECCIONES.map(s => {
                  const p = r.permisos?.find(p => p.seccion === s)
                  if (!p?.puede_leer && !p?.puede_escribir) return null
                  return (
                    <div key={s} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{SECCION_LABELS[s]}</span>
                      <div className="flex gap-1">
                        {p.puede_leer && (
                          <span className="text-xs bg-[#EBF8FF] text-[#2B6CB0] px-1.5 py-0.5 rounded">Lectura</span>
                        )}
                        {p.puede_escribir && (
                          <span className="text-xs bg-[#1B2A4A] text-white px-1.5 py-0.5 rounded">Escritura</span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(!r.permisos || r.permisos.every(p => !p.puede_leer && !p.puede_escribir)) && (
                  <p className="text-xs text-gray-300 italic">Sin permisos asignados</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Rol' : 'Nuevo Rol'} size="lg">
        <div className="space-y-4">
          <FormField label="Nombre del rol" required>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Gestor de proyectos" />
          </FormField>
          <FormField label="Descripción">
            <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2}
              placeholder="Descripción del perfil de acceso" />
          </FormField>

          <div>
            <p className="text-sm font-medium text-[#1B2A4A] mb-3">Permisos por sección</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F0F4F8]">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#1B2A4A] uppercase">Sección</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#1B2A4A] uppercase">Lectura</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-[#1B2A4A] uppercase">Escritura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {permisos.map(p => (
                    <tr key={p.seccion} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[#1B2A4A]">{SECCION_LABELS[p.seccion]}</td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={p.puede_leer}
                          onChange={e => setPermiso(p.seccion, 'puede_leer', e.target.checked)}
                          className="rounded border-gray-300 text-[#2B6CB0] focus:ring-[#2B6CB0]" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={p.puede_escribir}
                          onChange={e => setPermiso(p.seccion, 'puede_escribir', e.target.checked)}
                          className="rounded border-gray-300 text-[#1B2A4A] focus:ring-[#1B2A4A]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              * La escritura incluye lectura automáticamente. Al desmarcar lectura se quita la escritura.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} loading={saving}>{editando ? 'Guardar cambios' : 'Crear rol'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
