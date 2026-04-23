'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, Download } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import Btn from '@/components/shared/Btn'
import FormField from '@/components/shared/FormField'
import Input from '@/components/shared/Input'
import Textarea from '@/components/shared/Textarea'
import Select from '@/components/shared/Select'
import { Tarea, LineaAccion, Usuario, EstadoItem, ESTADO_LABELS } from '@/lib/types'
import { formatDate, calcularEstadoReal } from '@/lib/utils'

const ESTADOS: EstadoItem[] = ['pendiente', 'en_proceso', 'bloqueado', 'vencido', 'completado']

function calcFechaFin(inicio: string, dias: number) {
  if (!inicio || !dias) return ''
  const d = new Date(inicio + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().split('T')[0]
}

const emptyForm = {
  linea_id: '', nombre: '', descripcion: '', metrica_exito: '',
  responsable_id: '', fecha_inicio: '', duracion_dias: 1, fecha_fin: '',
  estado: 'pendiente' as EstadoItem, dependencias: [] as string[]
}

export default function TareasPage() {
  const [tareas, setTareas] = useState<any[]>([])
  const [lineas, setLineas] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [subtareaModalOpen, setSubtareaModalOpen] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [tareaParentId, setTareaParentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroLinea, setFiltroLinea] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroResponsable, setFiltroResponsable] = useState('')
  const [sortField, setSortField] = useState('nombre')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set())
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [subForm, setSubForm] = useState(emptyForm)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [t, l, u] = await Promise.all([
      fetch('/api/tareas').then(r => r.json()),
      fetch('/api/lineas').then(r => r.json()),
      fetch('/api/usuarios').then(r => r.json()),
    ])
    setTareas(Array.isArray(t) ? t : [])
    setLineas(Array.isArray(l) ? l : [])
    setUsuarios(Array.isArray(u) ? u : [])
    setLoading(false)
  }

  function openNuevo() {
    setEditando(null); setFormError('')
    setForm(emptyForm); setModalOpen(true)
  }

  function openEditar(t: any) {
    setEditando(t); setFormError('')
    setForm({
      linea_id: t.linea_id, nombre: t.nombre, descripcion: t.descripcion ?? '',
      metrica_exito: t.metrica_exito ?? '', responsable_id: t.responsable_id ?? '',
      fecha_inicio: t.fecha_inicio, duracion_dias: t.duracion_dias, fecha_fin: t.fecha_fin,
      estado: t.estado,
      dependencias: (t.dependencias ?? []).map((d: any) => d.depende_de_id)
    })
    setModalOpen(true)
  }

  function openNuevaSubtarea(tareaId: string) {
    setTareaParentId(tareaId); setSubForm(emptyForm); setSubtareaModalOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.linea_id || !form.nombre || !form.fecha_inicio || !form.duracion_dias) {
      setFormError('Completá los campos obligatorios'); return
    }
    setSaving(true)
    const payload = { ...form, fecha_fin: calcFechaFin(form.fecha_inicio, form.duracion_dias) }
    const url = editando ? `/api/tareas/${editando.id}` : '/api/tareas'
    const method = editando ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const err = await res.json(); setFormError(err.error ?? 'Error al guardar')
      setSaving(false); return
    }
    await fetchAll(); setModalOpen(false); setSaving(false)
  }

  async function handleSaveSubtarea() {
    if (!subForm.nombre || !subForm.fecha_inicio || !subForm.duracion_dias) return
    setSaving(true)
    const payload = {
      tarea_id: tareaParentId, nombre: subForm.nombre, descripcion: subForm.descripcion,
      metrica_exito: subForm.metrica_exito, responsable_id: subForm.responsable_id || null,
      fecha_inicio: subForm.fecha_inicio, duracion_dias: subForm.duracion_dias,
      fecha_fin: calcFechaFin(subForm.fecha_inicio, subForm.duracion_dias),
      estado: subForm.estado, depende_de_id: subForm.dependencias[0] || null,
    }
    await fetch('/api/subtareas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    await fetchAll(); setSubtareaModalOpen(false); setSaving(false)
  }

  async function handleDeleteTarea(id: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await fetch(`/api/tareas/${id}`, { method: 'DELETE' })
    await fetchAll()
  }

  async function handleEstadoRapido(id: string, estado: EstadoItem, esSubtarea = false) {
    const url = esSubtarea ? `/api/subtareas/${id}` : `/api/tareas/${id}`
    await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) })
    await fetchAll()
  }

  function toggleExpand(id: string) {
    setExpandidas(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  function exportarExcel() {
    import('xlsx').then(XLSX => {
      const rows = filtered.map(t => ({
        'Proyecto': (t.linea as any)?.proyecto?.nombre ?? '-',
        'Línea de Acción': (t.linea as any)?.nombre ?? '-',
        'Nro Línea': `Línea ${['I','II','III'][((t.linea as any)?.orden ?? 1) - 1] ?? (t.linea as any)?.orden}`,
        'Tarea': t.nombre,
        'Descripción': t.descripcion ?? '',
        'Responsable': t.responsable ? `${t.responsable.apellido}, ${t.responsable.nombre}` : '',
        'Estado': ESTADO_LABELS[t.estado as EstadoItem],
        'Fecha Inicio': formatDate(t.fecha_inicio),
        'Duración (días)': t.duracion_dias,
        'Fecha Fin': formatDate(t.fecha_fin),
        'Vencida': (calcularEstadoReal(t.estado, t.fecha_fin) === 'vencido') ? 'Sí' : 'No',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Tareas')
      XLSX.writeFile(wb, 'tareas_siap.xlsx')
    })
  }

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  )

  const filtered = tareas
    .filter(t => {
      const q = search.toLowerCase()
      const er = calcularEstadoReal(t.estado, t.fecha_fin)
      const matchSearch = !q || t.nombre.toLowerCase().includes(q) ||
        (t.linea as any)?.nombre?.toLowerCase().includes(q) ||
        (t.linea as any)?.proyecto?.nombre?.toLowerCase().includes(q)
      const matchLinea = !filtroLinea || t.linea_id === filtroLinea
      const matchEstado = !filtroEstado || er === filtroEstado
      const matchResp = !filtroResponsable || t.responsable_id === filtroResponsable
      return matchSearch && matchLinea && matchEstado && matchResp
    })
    .sort((a, b) => {
      const av = (a as any)[sortField] ?? ''; const bv = (b as any)[sortField] ?? ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

  const tareasDisponiblesParaDep = tareas.filter(t =>
    form.linea_id ? t.linea_id === form.linea_id : true
  ).filter(t => !editando || t.id !== editando.id)

  return (
    <div>
      <PageHeader title="Tareas" description="Gestión detallada de tareas y subtareas"
        action={
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={exportarExcel}><Download size={14} />Excel</Btn>
            <Btn onClick={openNuevo}><Plus size={16} />Nueva Tarea</Btn>
          </div>
        } />

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, línea o proyecto..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]" />
        </div>
        <select value={filtroLinea} onChange={e => setFiltroLinea(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todas las líneas</option>
          {lineas.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
        </select>
        <select value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los responsables</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin tareas" description="Creá la primera tarea"
            action={<Btn onClick={openNuevo} size="sm"><Plus size={14} />Nueva Tarea</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4F8] border-b border-gray-100">
                <tr>
                  <th className="w-8 px-2 py-3"></th>
                  {[['nombre','Tarea'],['proyecto','Proyecto'],['linea','Línea'],['estado','Estado'],['responsable','Responsable'],['fecha_inicio','Inicio'],['duracion_dias','Días'],['fecha_fin','Fin']].map(([f,l]) => (
                    <th key={f} onClick={() => toggleSort(f)}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase tracking-wider cursor-pointer hover:bg-[#EBF8FF] transition-colors select-none whitespace-nowrap">
                      {l}<SortIcon field={f} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Vencida</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(t => {
                  const subtareas = (t.subtareas ?? []) as any[]
                  const expanded = expandidas.has(t.id)
                  const er = calcularEstadoReal(t.estado, t.fecha_fin)
                  const linea = t.linea as any
                  const nroLinea = linea ? (['I','II','III'][linea.orden - 1] ?? linea.orden) : '-'
                  return (
                    <>
                      <tr key={t.id} className={`hover:bg-[#F0F4F8] transition-colors ${er === 'vencido' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-2 py-3.5 text-center">
                          {subtareas.length > 0 && (
                            <button onClick={() => toggleExpand(t.id)} className="text-gray-400 hover:text-[#2B6CB0]">
                              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-[#1B2A4A] max-w-[200px]">
                          <div className="truncate">{t.nombre}</div>
                          {subtareas.length > 0 && <div className="text-xs text-[#2B6CB0]">{subtareas.length} subtarea{subtareas.length !== 1 ? 's' : ''}</div>}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[150px]">
                          <div className="truncate">{linea?.proyecto?.nombre ?? '-'}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className="text-[#2B6CB0] font-medium">{nroLinea}.</span>
                          <span className="text-gray-500 ml-1 truncate max-w-[100px] inline-block align-bottom">{linea?.nombre ?? '-'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <select value={t.estado} onChange={e => handleEstadoRapido(t.id, e.target.value as EstadoItem)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none bg-white">
                            {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                          {t.responsable ? `${t.responsable.apellido}, ${t.responsable.nombre}` : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.fecha_inicio)}</td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs text-center">{t.duracion_dias}d</td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">{formatDate(t.fecha_fin)}</td>
                        <td className="px-4 py-3.5 text-center">
                          {er === 'vencido' ? <span className="text-xs font-semibold text-red-500">Sí</span> : <span className="text-xs text-gray-300">No</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openNuevaSubtarea(t.id)} title="Nueva subtarea"
                              className="p-1.5 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors">
                              <Plus size={13} />
                            </button>
                            <button onClick={() => openEditar(t)}
                              className="p-1.5 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDeleteTarea(t.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && subtareas.map((s: any) => (
                        <tr key={s.id} className="bg-[#F8FAFC] border-l-2 border-[#2B6CB0]">
                          <td className="px-2 py-2.5"></td>
                          <td className="px-4 py-2.5 pl-8 text-sm text-[#1B2A4A] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2B6CB0] flex-shrink-0" />{s.nombre}
                          </td>
                          <td colSpan={2} className="px-4 py-2.5 text-xs text-gray-400">Subtarea</td>
                          <td className="px-4 py-2.5">
                            <select value={s.estado} onChange={e => handleEstadoRapido(s.id, e.target.value as EstadoItem, true)}
                              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none bg-white">
                              {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">
                            {s.responsable ? `${s.responsable.apellido}, ${s.responsable.nombre}` : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{formatDate(s.fecha_inicio)}</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs text-center">{s.duracion_dias}d</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{formatDate(s.fecha_fin)}</td>
                          <td colSpan={2}></td>
                        </tr>
                      ))}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tarea */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Tarea' : 'Nueva Tarea'} size="lg">
        <div className="space-y-4">
          {formError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{formError}</div>}
          <FormField label="Línea de Acción" required>
            <Select value={form.linea_id} onChange={e => setForm(f => ({ ...f, linea_id: e.target.value, dependencias: [] }))} disabled={!!editando}>
              <option value="">Seleccioná una línea</option>
              {lineas.map(l => <option key={l.id} value={l.id}>{['I','II','III'][(l.orden??1)-1] ?? l.orden}. {l.nombre} — {(l.proyecto as any)?.nombre}</option>)}
            </Select>
          </FormField>
          <FormField label="Nombre" required>
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre de la tarea" />
          </FormField>
          <FormField label="Descripción">
            <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} />
          </FormField>
          <FormField label="¿Cómo se mide el éxito?">
            <Textarea value={form.metrica_exito} onChange={e => setForm(f => ({ ...f, metrica_exito: e.target.value }))} rows={2} />
          </FormField>
          <FormField label="Responsable">
            <Select value={form.responsable_id} onChange={e => setForm(f => ({ ...f, responsable_id: e.target.value }))}>
              <option value="">Sin responsable</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Fecha inicio" required>
              <Input type="date" value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value, fecha_fin: calcFechaFin(e.target.value, f.duracion_dias) }))} />
            </FormField>
            <FormField label="Duración (días)" required>
              <Input type="number" min={1} value={form.duracion_dias}
                onChange={e => setForm(f => ({ ...f, duracion_dias: Number(e.target.value), fecha_fin: calcFechaFin(f.fecha_inicio, Number(e.target.value)) }))} />
            </FormField>
            <FormField label="Fecha fin (calculada)">
              <Input value={form.fecha_fin ? formatDate(form.fecha_fin) : '-'} readOnly className="bg-gray-50 text-gray-400" />
            </FormField>
          </div>
          <FormField label="Estado">
            <Select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as EstadoItem }))}>
              {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
            </Select>
          </FormField>
          {tareasDisponiblesParaDep.length > 0 && (
            <FormField label="Depende de (puede elegir varias)">
              <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {tareasDisponiblesParaDep.map(t => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input type="checkbox" checked={form.dependencias.includes(t.id)}
                      onChange={e => setForm(f => ({
                        ...f, dependencias: e.target.checked
                          ? [...f.dependencias, t.id]
                          : f.dependencias.filter(d => d !== t.id)
                      }))} className="rounded border-gray-300 text-[#2B6CB0]" />
                    <span className="text-sm text-[#1B2A4A]">{t.nombre}</span>
                  </label>
                ))}
              </div>
            </FormField>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} loading={saving}>{editando ? 'Guardar cambios' : 'Crear tarea'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal Subtarea */}
      <Modal open={subtareaModalOpen} onClose={() => setSubtareaModalOpen(false)} title="Nueva Subtarea" size="md">
        <div className="space-y-4">
          <FormField label="Nombre" required>
            <Input value={subForm.nombre} onChange={e => setSubForm(f => ({ ...f, nombre: e.target.value }))} />
          </FormField>
          <FormField label="Descripción">
            <Textarea value={subForm.descripcion} onChange={e => setSubForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} />
          </FormField>
          <FormField label="Responsable">
            <Select value={subForm.responsable_id} onChange={e => setSubForm(f => ({ ...f, responsable_id: e.target.value }))}>
              <option value="">Sin responsable</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha inicio" required>
              <Input type="date" value={subForm.fecha_inicio}
                onChange={e => setSubForm(f => ({ ...f, fecha_inicio: e.target.value, fecha_fin: calcFechaFin(e.target.value, f.duracion_dias) }))} />
            </FormField>
            <FormField label="Duración (días)" required>
              <Input type="number" min={1} value={subForm.duracion_dias}
                onChange={e => setSubForm(f => ({ ...f, duracion_dias: Number(e.target.value), fecha_fin: calcFechaFin(f.fecha_inicio, Number(e.target.value)) }))} />
            </FormField>
          </div>
          <FormField label="Estado">
            <Select value={subForm.estado} onChange={e => setSubForm(f => ({ ...f, estado: e.target.value as EstadoItem }))}>
              {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setSubtareaModalOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSaveSubtarea} loading={saving}>Crear subtarea</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
