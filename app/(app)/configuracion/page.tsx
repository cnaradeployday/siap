'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, ImageIcon, FileText } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import Btn from '@/components/shared/Btn'

export default function ConfiguracionPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState<string | null>(null)
  const [logoMsg, setLogoMsg] = useState('')
  const [manualMsg, setManualMsg] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingManual, setUploadingManual] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const manualRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchConfig() }, [])

  async function fetchConfig() {
    const [logo, manual] = await Promise.all([
      fetch('/api/configuracion?clave=logo_url').then(r => r.json()),
      fetch('/api/configuracion?clave=manual_url').then(r => r.json()),
    ])
    setLogoUrl(logo)
    setManualUrl(manual)
  }

  async function uploadFile(tipo: 'logo' | 'manual', file: File) {
    const formData = new FormData()
    formData.append('file', file)

    if (tipo === 'logo') {
      setUploadingLogo(true)
      setLogoMsg('')
    } else {
      setUploadingManual(true)
      setManualMsg('')
    }

    const res = await fetch(`/api/configuracion/upload?tipo=${tipo}`, { method: 'POST', body: formData })
    const json = await res.json()

    if (tipo === 'logo') {
      setUploadingLogo(false)
      if (res.ok) {
        setLogoUrl(json.url)
        setLogoMsg('Logo actualizado correctamente. Recargá la página para verlo en el sistema.')
      } else {
        setLogoMsg(`Error: ${json.error}`)
      }
    } else {
      setUploadingManual(false)
      if (res.ok) {
        setManualUrl(json.url)
        setManualMsg('Manual subido correctamente.')
      } else {
        setManualMsg(`Error: ${json.error}`)
      }
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setLogoPreview(preview)
    uploadFile('logo', file)
  }

  function handleManualChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadFile('manual', file)
  }

  return (
    <div>
      <PageHeader title="Configuración del Sistema" description="Personalización y recursos del sistema" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo del sistema */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#EBF8FF] flex items-center justify-center">
              <ImageIcon size={18} className="text-[#2B6CB0]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1B2A4A]">Logo del Sistema</h3>
              <p className="text-xs text-gray-500">Se mostrará en la barra lateral</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-center h-32 bg-[#F0F4F8] rounded-xl border-2 border-dashed border-gray-200">
            {logoPreview || logoUrl ? (
              <img
                src={logoPreview ?? logoUrl!}
                alt="Logo actual"
                className="max-h-28 max-w-full object-contain rounded"
              />
            ) : (
              <div className="text-center text-gray-400">
                <ImageIcon size={32} className="mx-auto mb-1 opacity-40" />
                <p className="text-xs">Sin logo configurado</p>
              </div>
            )}
          </div>

          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />

          <Btn onClick={() => logoRef.current?.click()} loading={uploadingLogo} className="w-full justify-center">
            <Upload size={15} />
            {uploadingLogo ? 'Subiendo...' : 'Subir nuevo logo'}
          </Btn>

          {logoMsg && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${logoMsg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {logoMsg.startsWith('Error') ? <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> : <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />}
              {logoMsg}
            </div>
          )}
        </div>

        {/* Manual del sistema */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-[#EBF8FF] flex items-center justify-center">
              <FileText size={18} className="text-[#2B6CB0]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1B2A4A]">Manual del Sistema</h3>
              <p className="text-xs text-gray-500">Documento descargable para los usuarios</p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-center h-32 bg-[#F0F4F8] rounded-xl border-2 border-dashed border-gray-200">
            {manualUrl ? (
              <div className="text-center">
                <FileText size={32} className="mx-auto mb-2 text-[#2B6CB0] opacity-70" />
                <p className="text-xs text-gray-600 font-medium">Manual cargado</p>
                <a
                  href={manualUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#2B6CB0] underline mt-1 inline-block"
                >
                  Ver / Descargar
                </a>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <FileText size={32} className="mx-auto mb-1 opacity-40" />
                <p className="text-xs">Sin manual cargado</p>
              </div>
            )}
          </div>

          <input
            ref={manualRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleManualChange}
          />

          <Btn onClick={() => manualRef.current?.click()} loading={uploadingManual} className="w-full justify-center">
            <Upload size={15} />
            {uploadingManual ? 'Subiendo...' : 'Subir manual (PDF/Word)'}
          </Btn>

          {manualMsg && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${manualMsg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {manualMsg.startsWith('Error') ? <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> : <CheckCircle size={15} className="flex-shrink-0 mt-0.5" />}
              {manualMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
