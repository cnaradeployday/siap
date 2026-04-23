'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import Btn from '@/components/shared/Btn'
import FormField from '@/components/shared/FormField'
import Input from '@/components/shared/Input'
import Textarea from '@/components/shared/Textarea'
import Select from '@/components/shared/Select'
import { LineaAccion, Proyecto, Usuario, EstadoItem, ESTADO_LABELS } from '@/lib/types'
import { formatDate, calcularEstadoReal } from '@/lib/utils'

const ESTADOS: EstadoItem[] = ['pendiente', 'en_proceso', 'bloqueado', 'vencido', 'completado']

export default function LineasAccionPage() {
  const [lineas, setLineas] = useState<LineaAccion[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<LineaAccion | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroProyecto, setFiltroProyecto] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [sortField, setSortField] = useState('nombre')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    proyecto_id: '', nombre: '', descripcion: '', metrica_exito: '',
    responsable_id: '', patrocinador_id: '',
    fecha_inicio: '', fecha_fin: '', estado: 'pendiente' as EstadoItem, orden: 1
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [l, p, u] = await Promise.all([
      fetch('/api/lineas').then(r => r.json()),
      fetch('/api/proyectos').then(r => r.json()),
      fetch('/api/usuarios').then(r => r.json()),
    ])
    setLineas(Array.isArray(l) ? l : [])
    setProyectos(Array.isArray(p) ? p : [])
    setUsuarios(Array.isArray(u) ? u : [])
    setLoading(false)
  }

  function openNuevo() {
    setEditando(null)
    setFormError('')
    setForm({ proyecto_id: '', nombre: '', descripcion: '', metrica_exito: '',
      responsable_id: '', patrocinador_id: '', fecha_inicio: '', fecha_fin: '', estado: 'pendiente', orden: 1 })
    setModalOpen(true)
  }

  function openEditar(l: LineaAccion) {
    setEditando(l)
    setFormError('')
    setForm({
      proyecto_id: l.proyecto_id, nombre: l.nombre, descripcion: l.descripcion ?? '',
      metrica_exito: l.metrica_exito ?? '', responsable_id: l.responsable_id ?? '',
      patrocinador_id: l.patrocinador_id ?? '', fecha_inicio: l.fecha_inicio,
      fecha_fin: l.fecha_fin, estado: l.estado, orden: l.orden
    })
    setModalOpen(true)
  }

  async function handleEstadoRapido(id: string, estado: EstadoItem) {
    await fetch(`/api/lineas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    })
    await fetchAll()
  }

  async function handleSave() {
    setFormError('')
    if (!form.proyecto_id || !form.nombre || !form.fecha_inicio || !form.fecha_fin) {
      setFormError('Completá los campos obligatorios')
      return
    }
    const proyecto = proyectos.find(p => p.id === form.proyecto_id)
    if (proyecto) {
      if (form.fecha_inicio < proyecto.fecha_inicio || form.fecha_fin > proyecto.fecha_fin) {
        setFormError(`Las fechas deben estar entre ${formatDate(proyecto.fecha_inicio)} y ${formatDate(proyecto.fecha_fin)}`)
        return
      }
    }
    if (!editando) {
      const lineasDelProyecto = lineas.filter(l => l.proyecto_id === form.proyecto_id)
      if (lineasDelProyecto.length >= 3) {
        setFormError('El proyecto ya tiene el máximo de 3 líneas de acción')
        return
      }
    }
    setSaving(true)
    const url = editando ? `/api/lineas/${editando.id}` : '/api/lineas'
    const method = editando ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (!res.ok) {
      const err = await res.json()
      setFormError(err.error ?? 'Error al guardar')
      setSaving(false)
      return
    }
    await fetchAll()
    setModalOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta línea de acción?')) return
    await fetch(`/api/lineas/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const proyectoSeleccionado = proyectos.find(p => p.id === form.proyecto_id)

  const filtered = lineas
    .filter(l => {
      const q = search.toLowerCase()
      const estadoReal = calcularEstadoReal(l.estado, l.fecha_fin)
      const matchSearch = !q || l.nombre.toLowerCase().includes(q) ||
        (l.proyecto as any)?.nombre?.toLowerCase().includes(q)
      const matchProyecto = !filtroProyecto || l.proyecto_id === filtroProyecto
      const matchEstado = !filtroEstado || estadoReal === filtroEstado
      return matchSearch && matchProyecto && matchEstado
    })
    .sort((a, b) => {
      const av = (a as any)[sortField] ?? ''
      const bv = (b as any)[sortField] ?? ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  )

  return (
    <div>
      <PageHeader
        title="Líneas de Acción"
        description="Segmentos de trabajo dentro de cada proyecto (máx. 3 por proyecto)"
        action={<Btn onClick={openNuevo}><Plus size={16} />Nueva Línea</Btn>}
      />

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o proyecto..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]" />
        </div>
        <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin líneas de acción"
            description="Creá la primera línea de acción para un proyecto"
            action={<Btn onClick={openNuevo} size="sm"><Plus size={14} />Nueva Línea</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4F8] border-b border-gray-100">
                <tr>
                  {[['nombre','Nombre'],['proyecto','Proyecto'],['estado','Estado'],['responsable','Responsable'],['fecha_inicio','Inicio'],['fecha_fin','Fin']].map(([f,l]) => (
                    <th key={f} onClick={() => toggleSort(f)}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase tracking-wider cursor-pointer hover:bg-[#EBF8FF] transition-colors select-none">
                      {l}<SortIcon field={f} />
                    </th>
                  ))}
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(l => {
                  const estadoReal = calcularEstadoReal(l.estado, l.fecha_fin)
                  return (
                    <tr key={l.id} className="hover:bg-[#F0F4F8] transition-colors">
                      <td className="px-4 py-3.5 font-medium text-[#1B2A4A]">
                        <div>{l.nombre}</div>
                        <div className="text-xs text-gray-400">Línea {l.orden}</div>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{(l.proyecto as any)?.nombre ?? '-'}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={l.estado}
                          onChange={e => handleEstadoRapido(l.id, e.target.value as EstadoItem)}
                          className={`text-xs border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2B6CB0] bg-white font-medium ${
                            estadoReal === 'vencido' ? 'border-red-300 text-red-700' :
                            estadoReal === 'bloqueado' ? 'border-red-200 text-red-600' :
                            estadoReal === 'completado' ? 'border-green-200 text-green-700' :
                            estadoReal === 'en_proceso' ? 'border-blue-200 text-blue-700' :
                            'border-amber-200 text-amber-700'
                          }`}>
                          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                        </select>
                        {estadoReal === 'vencido' && l.estado !== 'vencido' && (
                          <div className="text-xs text-red-500 mt-0.5">⚠ Fecha vencida</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {(l.responsable as any) ? `${(l.responsable as any).apellido}, ${(l.responsable as any).nombre}` : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">{formatDate(l.fecha_inicio)}</td>
                      <td className="px-4 py-3.5 text-gray-500">{formatDate(l.fecha_fin)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => openEditar(l)}
                            className="p-1.5 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(l.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Línea de Acción' : 'Nueva Línea de Acción'} size="lg">
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{formError}</div>
          )}
          <FormField label="Proyecto" required>
            <Select value={form.proyecto_id}
              onChange={e => setForm(f => ({ ...f, proyecto_id: e.target.value, fecha_inicio: '', fecha_fin: '' }))}
              disabled={!!editando}>
              <option value="">Seleccioná un proyecto</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </FormField>
          {proyectoSeleccionado && (
            <div className="text-xs text-[#2B6CB0] bg-[#EBF8FF] px-3 py-2 rounded-lg">
              Rango del proyecto: {formatDate(proyectoSeleccionado.fecha_inicio)} → {formatDate(proyectoSeleccionado.fecha_fin)}
            </div>
          )}
          <FormField label="Nombre" required>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </FormField>
          <FormField label="Descripción">
            <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} />
          </FormField>
          <FormField label="¿Cómo se mide el éxito?">
            <Textarea value={form.metrica_exito} onChange={e => setForm(f => ({ ...f, metrica_exito: e.target.value }))} rows={2} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Responsable">
              <Select value={form.responsable_id} onChange={e => setForm(f => ({ ...f, responsable_id: e.target.value }))}>
                <option value="">Sin responsable</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
              </Select>
            </FormField>
            <FormField label="Patrocinador">
              <Select value={form.patrocinador_id} onChange={e => setForm(f => ({ ...f, patrocinador_id: e.target.value }))}>
                <option value="">Sin patrocinador</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Fecha inicio" required>
              <Input type="date" value={form.fecha_inicio}
                min={proyectoSeleccionado?.fecha_inicio}
                max={proyectoSeleccionado?.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
            </FormField>
            <FormField label="Fecha fin" required>
              <Input type="date" value={form.fecha_fin}
                min={form.fecha_inicio || proyectoSeleccionado?.fecha_inicio}
                max={proyectoSeleccionado?.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
            </FormField>
            <FormField label="Nro. de línea">
              <Select value={form.orden} onChange={e => setForm(f => ({ ...f, orden: Number(e.target.value) }))}>
                <option value={1}>Línea I</option>
                <option value={2}>Línea II</option>
                <option value={3}>Línea III</option>
              </Select>
            </FormField>
          </div>
          <FormField label="Estado">
            <Select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoItem }))}>
              {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} loading={saving}>
              {editando ? 'Guardar cambios' : 'Crear línea'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
