'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Btn from '@/components/shared/Btn'
import FormField from '@/components/shared/FormField'
import Input from '@/components/shared/Input'
import { KeyRound, CheckCircle } from 'lucide-react'

export default function PerfilPage() {
  const [form, setForm] = useState({ actual: '', nuevo: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.nuevo.length < 6) {
      setError('La contraseña nueva debe tener al menos 6 caracteres')
      return
    }
    if (form.nuevo !== form.confirmar) {
      setError('Las contraseñas nuevas no coinciden')
      return
    }

    setLoading(true)
    const res = await fetch('/api/usuarios/cambiar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password_actual: form.actual, password_nuevo: form.nuevo })
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al cambiar contraseña')
    } else {
      setSuccess(true)
      setForm({ actual: '', nuevo: '', confirmar: '' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-[#1B2A4A] mb-1">Mi Perfil</h1>
      <p className="text-gray-400 text-sm mb-6">Configuración de tu cuenta</p>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#1B2A4A] flex items-center justify-center">
            <KeyRound size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-[#1B2A4A]">Cambiar contraseña</h2>
            <p className="text-xs text-gray-400">Actualizá tu contraseña de acceso</p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <span className="text-green-700 text-sm">Contraseña actualizada correctamente</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <FormField label="Contraseña actual" required>
            <Input type="password" value={form.actual}
              onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
              placeholder="Tu contraseña actual" />
          </FormField>
          <FormField label="Nueva contraseña" required>
            <Input type="password" value={form.nuevo}
              onChange={e => setForm(f => ({ ...f, nuevo: e.target.value }))}
              placeholder="Mínimo 6 caracteres" />
          </FormField>
          <FormField label="Confirmar nueva contraseña" required>
            <Input type="password" value={form.confirmar}
              onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
              placeholder="Repetí la nueva contraseña" />
          </FormField>
          <div className="pt-2">
            <Btn type="submit" loading={loading} className="w-full">
              Cambiar contraseña
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
}
