'use client'
import { Usuario } from '@/lib/types'

export default function UserSelect({ usuarios, value, onChange, placeholder = 'Seleccionar usuario', required = false }: {
  usuarios: Usuario[]; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-white"
    >
      <option value="">{placeholder}</option>
      {usuarios.map(u => (
        <option key={u.id} value={u.id}>{u.apellido}, {u.nombre}</option>
      ))}
    </select>
  )
}
