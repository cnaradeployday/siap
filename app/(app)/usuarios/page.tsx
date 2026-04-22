'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Link, Search, UserCheck, UserX } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Modal from '@/components/shared/Modal'
import Btn from '@/components/shared/Btn'
import FormField from '@/components/shared/FormField'
import Input from '@/components/shared/Input'
import Select from '@/components/shared/Select'
import { Usuario, Rol } from '@/lib/types'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [enlaceModalOpen, setEnlaceModalOpen] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')
  const [sortField, setSortField] = useState('apellido')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [authUsers, setAuthUsers] = useState<{id:string,email:string}[]>([])

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', rol_id: '', is_admin: false, activo: true
  })
  const [enlaceEmail, setEnlaceEmail] = useState('')
  const [enlaceAuthId, setEnlaceAuthId] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [u, r, a] = await Promise.all([
      fetch('/api/usuarios').then(r => r.json()),
      fetch('/api/roles').then(r => r.json()),
      fetch('/api/auth-users').then(r => r.json()),
    ])
    setUsuarios(Array.isArray(u) ? u : [])
    setRoles(Array.isArray(r) ? r : [])
    setAuthUsers(Array.isArray(a) ? a : [])
    setLoading(false)
  }

  function openNuevo() {
    setEditando(null)
    setForm({ nombre: '', apellido: '', email: '', rol_id: '', is_admin: false, activo: true })
    setModalOpen(true)
  }

  function openEditar(u: Usuario) {
    setEditando(u)
    setForm({
      nombre: u.nombre, apellido: u.apellido, email: u.email ?? '',
      rol_id: u.rol_id ?? '', is_admin: u.is_admin, activo: u.activo
    })
    setModalOpen(true)
  }

  function openEnlace(u: Usuario) {
    setEditando(u)
    setEnlaceEmail(u.email ?? '')
    setEnlaceAuthId(u.auth_user_id ?? '')
    setEnlaceModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre || !form.apellido) return
    setSaving(true)
    const url = editando ? `/api/usuarios/${editando.id}` : '/api/usuarios'
    const method = editando ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, rol_id: form.rol_id || null }) })
    await fetchAll()
    setModalOpen(false)
    setSaving(false)
  }

  async function handleEnlace() {
    if (!editando || !enlaceAuthId) return
    setSaving(true)
    await fetch(`/api/usuarios/${editando.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_user_id: enlaceAuthId, email: enlaceEmail })
    })
    await fetchAll()
    setEnlaceModalOpen(false)
    setSaving(false)
  }

  async function toggleActivo(u: Usuario) {
    await fetch(`/api/usuarios/${u.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo })
    })
    await fetchAll()
  }

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: string }) => (
    <span className="ml-1 text-gray-400">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
  )

  const filtered = usuarios
    .filter(u => {
      const q = search.toLowerCase()
      const matchSearch = !q || u.nombre.toLowerCase().includes(q) || u.apellido.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
      const matchRol = !filtroRol || u.rol_id === filtroRol
      const matchActivo = filtroActivo === '' || String(u.activo) === filtroActivo
      return matchSearch && matchRol && matchActivo
    })
    .sort((a, b) => {
      const av = (a as any)[sortField] ?? ''
      const bv = (b as any)[sortField] ?? ''
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })

  const sinEnlazar = authUsers.filter(a => !usuarios.some(u => u.auth_user_id === a.id))

  return (
    <div>
      <PageHeader title="Usuarios" description="Gestión de usuarios del sistema"
        action={<Btn onClick={openNuevo}><Plus size={16} />Nuevo Usuario</Btn>} />

      {sinEnlazar.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 text-sm font-medium mb-2">
            {sinEnlazar.length} cuenta{sinEnlazar.length > 1 ? 's' : ''} de Google sin enlazar:
          </p>
          <div className="flex flex-wrap gap-2">
            {sinEnlazar.map(a => (
              <span key={a.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{a.email}</span>
            ))}
          </div>
          <p className="text-amber-600 text-xs mt-2">Editá el usuario correspondiente y usá el botón de enlace para conectarlos.</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]" />
        </div>
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos los roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
        <select value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin usuarios" description="Creá el primer usuario del sistema"
            action={<Btn onClick={openNuevo} size="sm"><Plus size={14} />Nuevo Usuario</Btn>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F0F4F8] border-b border-gray-100">
                <tr>
                  {[['apellido','Apellido'],['nombre','Nombre'],['email','Email'],['rol','Rol']].map(([f,l]) => (
                    <th key={f} onClick={() => toggleSort(f)}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase tracking-wider cursor-pointer hover:bg-[#EBF8FF] transition-colors select-none">
                      {l}<SortIcon field={f} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#1B2A4A] uppercase">Enlace Google</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-[#F0F4F8] transition-colors ${!u.activo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3.5 font-medium text-[#1B2A4A]">{u.apellido}</td>
                    <td className="px-4 py-3.5 text-gray-600">{u.nombre}</td>
                    <td className="px-4 py-3.5 text-gray-500">{u.email ?? <span className="text-gray-300 italic">Sin email</span>}</td>
                    <td className="px-4 py-3.5">
                      {u.is_admin
                        ? <span className="text-xs bg-[#1B2A4A] text-white px-2 py-0.5 rounded-full">Admin</span>
                        : <span className="text-xs bg-[#EBF8FF] text-[#2B6CB0] px-2 py-0.5 rounded-full">{(u.rol as any)?.nombre ?? 'Sin rol'}</span>
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.auth_user_id
                        ? <span className="text-xs text-green-600 flex items-center gap-1"><UserCheck size={13} />Enlazado</span>
                        : <span className="text-xs text-amber-500 flex items-center gap-1"><UserX size={13} />Sin enlazar</span>
                      }
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEnlace(u)}
                          className="p-1.5 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors" title="Enlazar con Google">
                          <Link size={13} />
                        </button>
                        <button onClick={() => openEditar(u)}
                          className="p-1.5 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => toggleActivo(u)}
                          className={`p-1.5 rounded-lg transition-colors ${u.activo ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-green-50 text-gray-400 hover:text-green-500'}`}
                          title={u.activo ? 'Desactivar' : 'Activar'}>
                          {u.activo ? <UserX size={13} /> : <UserCheck size={13} />}
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

      {/* Modal Usuario */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Usuario' : 'Nuevo Usuario'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nombre" required>
              <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </FormField>
            <FormField label="Apellido" required>
              <Input value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Se completa al enlazar con Google" />
          </FormField>
          <FormField label="Rol">
            <Select value={form.rol_id} onChange={e => setForm(f => ({ ...f, rol_id: e.target.value }))}>
              <option value="">Sin rol</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </Select>
          </FormField>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_admin" checked={form.is_admin}
              onChange={e => setForm(f => ({ ...f, is_admin: e.target.checked }))}
              className="rounded border-gray-300 text-[#2B6CB0]" />
            <label htmlFor="is_admin" className="text-sm text-[#1B2A4A]">Es administrador (acceso total)</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="activo" checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="rounded border-gray-300 text-[#2B6CB0]" />
            <label htmlFor="activo" className="text-sm text-[#1B2A4A]">Usuario activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleSave} loading={saving}>{editando ? 'Guardar' : 'Crear usuario'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Modal Enlace */}
      <Modal open={enlaceModalOpen} onClose={() => setEnlaceModalOpen(false)}
        title="Enlazar con cuenta Google" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Seleccioná la cuenta de Google que corresponde a <strong>{editando?.nombre} {editando?.apellido}</strong>
          </p>
          <FormField label="Cuenta Google">
            <Select value={enlaceAuthId} onChange={e => {
              const user = authUsers.find(a => a.id === e.target.value)
              setEnlaceAuthId(e.target.value)
              if (user) setEnlaceEmail(user.email)
            }}>
              <option value="">Seleccioná una cuenta</option>
              {authUsers.map(a => (
                <option key={a.id} value={a.id}>{a.email}</option>
              ))}
            </Select>
          </FormField>
          {enlaceEmail && (
            <div className="p-3 bg-[#EBF8FF] rounded-lg text-sm text-[#2B6CB0]">
              Email a enlazar: <strong>{enlaceEmail}</strong>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setEnlaceModalOpen(false)}>Cancelar</Btn>
            <Btn onClick={handleEnlace} loading={saving} disabled={!enlaceAuthId}>Enlazar cuenta</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}
