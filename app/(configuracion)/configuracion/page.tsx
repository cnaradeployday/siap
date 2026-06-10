'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, LogIn, LogOut, Users, Palette } from 'lucide-react'
import { Organizacion, Usuario } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface OrgConUsuarios extends Organizacion {
  usuarios?: Usuario[]
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const [orgs, setOrgs] = useState<OrgConUsuarios[]>([])
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [usuariosModalOpen, setUsuariosModalOpen] = useState(false)
  const [editando, setEditando] = useState<Organizacion | null>(null)
  const [orgSeleccionada, setOrgSeleccionada] = useState<Organizacion | null>(null)
  const [saving, setSaving] = useState(false)
  const [entering, setEntering] = useState<string | null>(null)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    texto_sidebar: 'Sistema Administración Proyectos',
    color_primario: '#1B2A4A',
    color_acento: '#2B6CB0',
  })

  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<string[]>([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [orgsData, usuariosData] = await Promise.all([
      fetch('/api/organizaciones').then(r => r.json()),
      fetchTodosUsuarios(),
    ])
    setOrgs(Array.isArray(orgsData) ? orgsData : [])
    setLoading(false)
  }

  async function fetchTodosUsuarios(): Promise<void> {
    // Necesitamos todos los usuarios sin filtro de org para poder asignarlos
    const res = await fetch('/api/super/usuarios').then(r => r.json())
    setTodosUsuarios(Array.isArray(res) ? res : [])
  }

  function openNueva() {
    setEditando(null)
    setFormError('')
    setForm({ nombre: '', texto_sidebar: 'Sistema Administración Proyectos', color_primario: '#1B2A4A', color_acento: '#2B6CB0' })
    setModalOpen(true)
  }

  function openEditar(org: Organizacion) {
    setEditando(org)
    setFormError('')
    setForm({
      nombre: org.nombre,
      texto_sidebar: org.texto_sidebar,
      color_primario: org.color_primario,
      color_acento: org.color_acento,
    })
    setModalOpen(true)
  }

  function openUsuarios(org: Organizacion) {
    setOrgSeleccionada(org)
    const actuales = todosUsuarios.filter(u => u.organizacion_id === org.id).map(u => u.id)
    setUsuariosSeleccionados(actuales)
    setUsuariosModalOpen(true)
  }

  async function handleSave() {
    setFormError('')
    if (!form.nombre.trim()) { setFormError('El nombre es obligatorio'); return }
    setSaving(true)

    const url = editando ? `/api/organizaciones/${editando.id}` : '/api/organizaciones'
    const method = editando ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? 'Error al guardar'); setSaving(false); return }

    await fetchAll()
    setModalOpen(false)
    setSaving(false)
  }

  async function handleGuardarUsuarios() {
    if (!orgSeleccionada) return
    setSaving(true)

    // Asignar usuarios seleccionados a esta org, desasignar los que se quitaron
    const usuariosDeEstaOrg = todosUsuarios.filter(u => u.organizacion_id === orgSeleccionada.id).map(u => u.id)
    const aAgregar = usuariosSeleccionados.filter(id => !usuariosDeEstaOrg.includes(id))
    const aQuitar = usuariosDeEstaOrg.filter(id => !usuariosSeleccionados.includes(id))

    const ops: Promise<any>[] = []

    for (const id of aAgregar) {
      ops.push(fetch(`/api/super/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizacion_id: orgSeleccionada.id }),
      }))
    }

    for (const id of aQuitar) {
      ops.push(fetch(`/api/super/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizacion_id: null }),
      }))
    }

    await Promise.all(ops)
    await fetchAll()
    setUsuariosModalOpen(false)
    setSaving(false)
  }

  async function handleEntrar(orgId: string) {
    setEntering(orgId)
    await fetch('/api/super/enter-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId }),
    })
    router.push('/dashboard')
  }

  function toggleUsuario(id: string) {
    setUsuariosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Organizaciones</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestioná las organizaciones del sistema</p>
        </div>
        <button onClick={openNueva}
          className="flex items-center gap-2 bg-[#1B2A4A] hover:bg-[#2B6CB0] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={16} /> Nueva organización
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#2B6CB0] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center text-gray-400">
          No hay organizaciones aún.
        </div>
      ) : (
        <div className="grid gap-4">
          {orgs.map(org => {
            const cantUsuarios = todosUsuarios.filter(u => u.organizacion_id === org.id).length
            return (
              <div key={org.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                {/* Preview colores */}
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: org.color_primario }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: org.color_acento }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[#1B2A4A]">{org.nombre}</p>
                    {!org.activo && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactiva</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{org.texto_sidebar}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: org.color_primario }} />
                      {org.color_primario}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: org.color_acento }} />
                      {org.color_acento}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openUsuarios(org)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-[#EBF8FF] hover:text-[#2B6CB0] border border-gray-200 transition-colors">
                    <Users size={13} /> {cantUsuarios} usuarios
                  </button>
                  <button onClick={() => openEditar(org)}
                    className="p-2 rounded-lg hover:bg-[#EBF8FF] text-gray-400 hover:text-[#2B6CB0] transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleEntrar(org.id)}
                    disabled={entering === org.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#1B2A4A] hover:bg-[#2B6CB0] text-white transition-colors disabled:opacity-50">
                    <LogIn size={13} />
                    {entering === org.id ? 'Entrando...' : 'Entrar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Crear/Editar Org */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-5">
              {editando ? 'Editar organización' : 'Nueva organización'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{formError}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Nombre</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                  placeholder="Ej: Ministerio de Economía" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">Texto del sidebar</label>
                <input value={form.texto_sidebar} onChange={e => setForm(f => ({ ...f, texto_sidebar: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                  placeholder="Ej: Sistema Administración Proyectos" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5 flex items-center gap-1.5">
                    <Palette size={13} /> Color primario (sidebar)
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color_primario}
                      onChange={e => setForm(f => ({ ...f, color_primario: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                    <span className="text-sm text-gray-500 font-mono">{form.color_primario}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5 flex items-center gap-1.5">
                    <Palette size={13} /> Color acento
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color_acento}
                      onChange={e => setForm(f => ({ ...f, color_acento: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5" />
                    <span className="text-sm text-gray-500 font-mono">{form.color_acento}</span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: form.color_primario }}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: form.color_acento }} />
                  <div>
                    <p className="text-white font-bold text-xs">SIAP</p>
                    <p className="text-white/50 text-[9px]">{form.texto_sidebar || '—'}</p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white" style={{ backgroundColor: form.color_acento }}>
                    Vista previa del acento
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#1B2A4A] hover:bg-[#2B6CB0] transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear organización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignación de Usuarios */}
      {usuariosModalOpen && orgSeleccionada && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-[#1B2A4A] mb-1">
              Usuarios — {orgSeleccionada.nombre}
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              Seleccioná los usuarios que pertenecen a esta organización.
            </p>

            <div className="max-h-80 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
              {todosUsuarios.filter(u => !u.is_super_admin).length === 0 ? (
                <p className="text-center py-8 text-gray-400 text-sm">No hay usuarios disponibles</p>
              ) : (
                todosUsuarios
                  .filter(u => !u.is_super_admin)
                  .map(u => {
                    const seleccionado = usuariosSeleccionados.includes(u.id)
                    return (
                      <label key={u.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${seleccionado ? 'bg-[#EBF8FF]' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={seleccionado}
                          onChange={() => toggleUsuario(u.id)}
                          className="rounded border-gray-300 text-[#2B6CB0]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1B2A4A]">{u.apellido}, {u.nombre}</p>
                          <p className="text-xs text-gray-400">{u.email ?? 'Sin email'}</p>
                        </div>
                        {u.organizacion_id && u.organizacion_id !== orgSeleccionada.id && (
                          <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                            Otra org
                          </span>
                        )}
                      </label>
                    )
                  })
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              {usuariosSeleccionados.length} usuario(s) seleccionado(s)
            </p>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setUsuariosModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardarUsuarios} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#1B2A4A] hover:bg-[#2B6CB0] transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar asignación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
