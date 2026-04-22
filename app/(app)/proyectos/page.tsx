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
import { Proyecto, Usuario, EstadoItem, ESTADO_LABELS } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const ESTADOS: EstadoItem[] = ['pendiente', 'en_proceso', 'bloqueado', 'vencido', 'completado']

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Proyecto | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPatrocinador, setFiltroPatrocinador] = useState('')
  const [sortField, setSortField] = useState<string>('nombre')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [form, setForm] = useState({
    nombre: '', descripcion: '', metrica_exito: '',
    patrocinador_id: '', fecha_inicio: '', fecha_fin: '', estado: 'pendiente' as EstadoItem
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [p, u] = await Promise.all([
      fetch('/api/proyectos').then(r => r.json()),
      fetch('/api/usuarios').then(r => r.json()),
    ])
    setProyectos(p)
    setUsuarios(u)
    setLoading(false)
  }

  function openNuevo() {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', metrica_exito: '', patrocinador_id: '', fecha_inicio: '', fecha_fin: '', estado: 'pendiente' })
    setModalOpen(true)
  }

  function openEditar(p: Proyecto) {
    setEditando(p)
    setForm({
      nombre: p.nombre, descripcion: p.descripcion ?? '', metrica_exito: p.metrica_exito ?? '',
      patrocinador_id: p.patrocinador_id ?? '', fecha_inicio: p.fecha_inicio, fecha_fin: p.fecha_fin, estado: p.estado
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre || !form.fecha_inicio || !form.fecha_fin) return
    setSaving(true)
    const url = editando ? `/api/proyectos/${editando.id}` : '/api/proyectos'
    const method = editando ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    await fetchAll()
    setModalOpen(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este proyecto?')) return
    await fetch(`/api/proyectos/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = proyectos
    .filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.nombre.toLowerCase().includes(q) ||
        (p.patrocinador as any)?.nombre?.toLowerCase().includes(q)
      const matchEstado = !filtroEstado || p.estado === filtroEstado
      const matchPat = !filtroPatrocinador || p.patrocinador_id === filtroPatrocinador
      return matchSearch && matchEstado && matchPat
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
        title="Proyectos"
        description="Gestión de proyectos estratégicos"
        action={<Btn onClick={openNuevo}><Plus size={16} />Nuevo Proyecto</Btn>}
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o patrocinador..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]" />
        </div>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
        </select>
        <select value={filtroPatrocinador} onChange={e => setFiltroPatrocinador(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los patrocinadores</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin proyectos" description="Creá el primer proyecto para comenzar"
            action={<Btn onClick={openNuevo} size="sm"><Plus size={14} />Nuevo Proyecto</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4F8] border-b border-gray-100">
                <tr>
                  {[['nombre','Nombre'],['estado','Estado'],['patrocinador','Patrocinador'],['fecha_inicio','Inicio'],['fecha_fin','Fin']].map(([f,l]) => (
                    <th key={f} onClick={() => toggleSort(f)}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase tracking-wider cursor-pointer hover:bg-[#EBF8FF] transition-colors select-none">
                      {l}<SortIcon field={f} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase tracking-wider">Líneas</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-[#F0F4F8] transition-colors">
                    <td className="px-4 py-3.5 font-medium text-[#1B2A4A]">{p.nombre}</td>
                    <td className="px-4 py-3.5"><StatusBadge estado={p.estado} /></td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {(p.patrocinador as any) ? `${(p.patrocinador as any).apellido}, ${(p.patrocinador as any).nombre}` : '-'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{formatDate(p.fecha_inicio)}</td>
                    <td className="px-4 py-3.5 text-gray-500">{formatDate(p.fecha_fin)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1">
                        {((p.lineas_accion as any[]) ?? []).map((l: any) => (
                          <span key={l.id} className="text-xs bg-[#EBF8FF] text-[#2B6CB0] px-2 py-0.5 rounded-full">{l.nombre}</span>
                        ))}
                        {((p.lineas_accion as any[]) ?? []).length === 0 && <span className="text-gray-400 text-xs">Sin líneas</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEditar(p)} className="p-1.5 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Proyecto' : 'Nuevo Proyecto'} size="lg">
        <div className="space-y-4">
          <FormField label="Nombre" required>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre del proyecto" />
          </FormField>
          <FormField label="Descripción">
            <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} placeholder="¿De qué trata el proyecto?" />
          </FormField>
          <FormField label="¿Cómo se mide el éxito?">
            <Textarea value={form.metrica_exito} onChange={e => setForm(f => ({ ...f, metrica_exito: e.target.value }))} rows={2} placeholder="Indicadores o métricas de éxito" />
          </FormField>
          <FormField label="Patrocinador">
            <Select value={form.patrocinador_id} onChange={e => setForm(f => ({ ...f, patrocinador_id: e.target.value }))}>
              <option value="">Sin patrocinador</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha inicio" required>
              <Input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
            </FormField>
            <FormField label="Fecha fin" required>
              <Input type="date" value={form.fecha_fin} min={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
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
              {editando ? 'Guardar cambios' : 'Crear proyecto'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
