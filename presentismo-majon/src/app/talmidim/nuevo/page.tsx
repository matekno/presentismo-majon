'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Facehash } from 'facehash'
import { comprimirImagen, validarArchivoDeImagen, subirFotoTalmid } from '@/lib/foto-client'

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b']

export default function NuevoTalmidPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
  })
  // La foto se sube recién después de crear el talmid (la ruta necesita su id).
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const errorValidacion = validarArchivoDeImagen(file)
    if (errorValidacion) {
      alert(errorValidacion)
      return
    }

    setUploadingPhoto(true)
    try {
      const blob = await comprimirImagen(file)
      setFotoBlob(blob)
      setFotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(blob)
      })
    } catch (error) {
      console.error('Error al procesar imagen:', error)
      alert('Error al procesar la imagen')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const quitarFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    setFotoBlob(null)
    setFotoPreview('')
  }

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.apellido.trim()) {
      setError('Nombre y apellido son requeridos')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/talmidim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const json = await res.json()

      if (res.ok) {
        if (fotoBlob) {
          try {
            await subirFotoTalmid(json.talmid.id, fotoBlob)
          } catch (error) {
            // El talmid ya existe: avisamos pero igual lo abrimos para no perder la carga.
            console.error('Error al subir la foto:', error)
            alert('El talmid se creó, pero la foto no se pudo subir. Podés reintentarlo desde su ficha.')
          }
        }
        router.push(`/talmidim/${json.talmid.id}`)
      } else {
        setError(json.error || 'Error al guardar')
        setSaving(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexion')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/talmidim" className="text-indigo-200 hover:text-white">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold">Nuevo talmid</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto
            </label>
            <div className="flex items-center gap-4">
              {fotoPreview ? (
                <div className="relative">
                  <img
                    src={fotoPreview}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={quitarFoto}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-300">
                  <Facehash name={`${formData.nombre} ${formData.apellido}`} size={80} colors={AVATAR_COLORS} />
                </div>
              )}
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <div className={`cursor-pointer text-center px-4 py-3 border-2 border-dashed rounded-lg transition ${
                  uploadingPhoto
                    ? 'border-gray-200 bg-gray-50 text-gray-400'
                    : 'border-indigo-300 hover:border-indigo-500 text-indigo-600 hover:bg-indigo-50'
                }`}>
                  {uploadingPhoto ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Subir foto</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              value={formData.fechaNacimiento}
              onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              placeholder="+54 11 1234-5678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Necesario para que el talmid pueda usar la app SoyTalmid
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || uploadingPhoto}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Agregar talmid'}
          </button>
        </div>
      </main>
    </div>
  )
}
