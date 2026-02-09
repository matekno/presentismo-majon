'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Facehash } from 'facehash'

interface Nota {
  id: string
  categoria: string
  contenido: string
  createdAt: string
}

interface Asistencia {
  id: string
  fecha: string
  diaSemana: string
  estado: string
  justificacion: string | null
}

interface AusenciaProgramada {
  id: string
  fechaInicio: string
  fechaFin: string
  justificacion: string
  activa: boolean
  createdAt: string
}

interface Talmid {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: string | null
  telefono: string | null
  email: string | null
  fotoUrl: string | null
  activo: boolean
  createdAt: string
}

interface Estadisticas {
  presentes: number
  tardanzas: number
  ausentes: number
  totalClases: number
  porcentajeAsistencia: number
}

interface TalmidData {
  talmid: Talmid
  notas: Nota[]
  asistencias: Asistencia[]
  estadisticas: Estadisticas
}

const CATEGORIAS = [
  { value: 'academico', label: 'Academico', color: 'blue' },
  { value: 'conducta', label: 'Conducta', color: 'orange' },
  { value: 'salud', label: 'Salud', color: 'red' },
  { value: 'general', label: 'General', color: 'gray' },
]

export default function TalmidFichaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [data, setData] = useState<TalmidData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'notas' | 'asistencia' | 'vacaciones'>('info')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    fotoUrl: '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showNotaForm, setShowNotaForm] = useState(false)
  const [nuevaNota, setNuevaNota] = useState({ categoria: 'general', contenido: '' })
  const [ausencias, setAusencias] = useState<AusenciaProgramada[]>([])
  const [showAusenciaForm, setShowAusenciaForm] = useState(false)
  const [nuevaAusencia, setNuevaAusencia] = useState({ fechaInicio: '', fechaFin: '', justificacion: '' })
  const [savingAusencia, setSavingAusencia] = useState(false)
  const [ausenciaError, setAusenciaError] = useState('')

  useEffect(() => {
    fetchTalmid()
    fetchAusencias()
  }, [id])

  const fetchTalmid = async () => {
    try {
      const res = await fetch(`/api/talmidim/${id}`)
      const json = await res.json()
      setData(json)
      if (json.talmid) {
        setFormData({
          nombre: json.talmid.nombre,
          apellido: json.talmid.apellido,
          fechaNacimiento: json.talmid.fechaNacimiento || '',
          telefono: json.talmid.telefono || '',
          email: json.talmid.email || '',
          fotoUrl: json.talmid.fotoUrl || '',
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAusencias = async () => {
    try {
      const res = await fetch(`/api/talmidim/${id}/ausencias-programadas`)
      const json = await res.json()
      setAusencias(json.ausencias || [])
    } catch (error) {
      console.error('Error fetching ausencias:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/talmidim/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await fetchTalmid()
        setEditMode(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddNota = async () => {
    if (!nuevaNota.contenido.trim()) return

    try {
      const res = await fetch(`/api/talmidim/${id}/notas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaNota),
      })

      if (res.ok) {
        const json = await res.json()
        setData((prev) =>
          prev
            ? { ...prev, notas: [json.nota, ...prev.notas] }
            : null
        )
        setNuevaNota({ categoria: 'general', contenido: '' })
        setShowNotaForm(false)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteNota = async (notaId: string) => {
    if (!confirm('Eliminar esta nota?')) return

    try {
      const res = await fetch(`/api/talmidim/${id}/notas`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notaId }),
      })

      if (res.ok) {
        setData((prev) =>
          prev
            ? { ...prev, notas: prev.notas.filter((n) => n.id !== notaId) }
            : null
        )
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAddAusencia = async () => {
    if (!nuevaAusencia.fechaInicio || !nuevaAusencia.fechaFin || !nuevaAusencia.justificacion.trim()) {
      setAusenciaError('Todos los campos son requeridos')
      return
    }

    setSavingAusencia(true)
    setAusenciaError('')

    try {
      const res = await fetch(`/api/talmidim/${id}/ausencias-programadas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaAusencia),
      })

      const json = await res.json()

      if (res.ok) {
        setAusencias((prev) => [json.ausencia, ...prev])
        setNuevaAusencia({ fechaInicio: '', fechaFin: '', justificacion: '' })
        setShowAusenciaForm(false)
      } else {
        setAusenciaError(json.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error:', error)
      setAusenciaError('Error de conexion')
    } finally {
      setSavingAusencia(false)
    }
  }

  const handleDeleteAusencia = async (ausenciaId: string) => {
    if (!confirm('Eliminar esta ausencia programada?')) return

    try {
      const res = await fetch(`/api/talmidim/${id}/ausencias-programadas`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ausenciaId }),
      })

      if (res.ok) {
        setAusencias((prev) => prev.filter((a) => a.id !== ausenciaId))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const formatDateRange = (inicio: string, fin: string) => {
    const formatOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    const inicioDate = new Date(inicio + 'T12:00:00')
    const finDate = new Date(fin + 'T12:00:00')
    const inicioStr = inicioDate.toLocaleDateString('es-AR', formatOpts)
    const finStr = finDate.toLocaleDateString('es-AR', formatOpts)
    if (inicio === fin) return inicioStr
    return `${inicioStr} - ${finStr}`
  }

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

  const getCategoriaColor = (categoria: string) => {
    const cat = CATEGORIAS.find((c) => c.value === categoria)
    switch (cat?.color) {
      case 'blue': return 'bg-blue-100 text-blue-700'
      case 'orange': return 'bg-orange-100 text-orange-700'
      case 'red': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date()
    const nacimiento = new Date(fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const m = hoy.getMonth() - nacimiento.getMonth()
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen')
      return
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es muy grande. Maximo 2MB')
      return
    }

    setUploadingPhoto(true)
    try {
      // Comprimir y convertir a base64
      const base64 = await compressAndConvertToBase64(file)
      setFormData({ ...formData, fotoUrl: base64 })
    } catch (error) {
      console.error('Error al procesar imagen:', error)
      alert('Error al procesar la imagen')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const compressAndConvertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_SIZE = 400 // Tamaño maximo del lado mas largo

          let width = img.width
          let height = img.height

          // Redimensionar manteniendo proporcion
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('No canvas context'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Convertir a JPEG con calidad 0.8
          const base64 = canvas.toDataURL('image/jpeg', 0.8)
          resolve(base64)
        }
        img.onerror = () => reject(new Error('Error loading image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsDataURL(file)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!data?.talmid) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Talmid no encontrado</p>
          <Link href="/talmidim" className="text-indigo-600 mt-2 inline-block">
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  const { talmid, notas, asistencias, estadisticas } = data

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-700 text-white">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/talmidim" className="text-indigo-200 hover:text-white">
              ← Volver
            </Link>
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-indigo-200 hover:text-white text-sm"
            >
              {editMode ? 'Cancelar' : 'Editar'}
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="max-w-lg mx-auto px-4 pb-6 text-center">
          {talmid.fotoUrl ? (
            <img
              src={talmid.fotoUrl}
              alt={`${talmid.nombre} ${talmid.apellido}`}
              className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
            />
          ) : (
            <div className="mx-auto border-4 border-white shadow-lg rounded-full w-24 h-24 overflow-hidden">
              <Facehash name={`${talmid.nombre} ${talmid.apellido}`} size={96} />
            </div>
          )}
          <h1 className="text-2xl font-bold mt-3">
            {talmid.nombre} {talmid.apellido}
          </h1>
          {talmid.fechaNacimiento && (
            <p className="text-indigo-200 mt-1">
              {calcularEdad(talmid.fechaNacimiento)} anios
            </p>
          )}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-indigo-600">
                {estadisticas.porcentajeAsistencia}%
              </div>
              <div className="text-xs text-gray-500">Asistencia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.presentes}
              </div>
              <div className="text-xs text-gray-500">Presentes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {estadisticas.tardanzas}
              </div>
              <div className="text-xs text-gray-500">Tardanzas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {estadisticas.ausentes}
              </div>
              <div className="text-xs text-gray-500">Ausentes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex">
            {(['info', 'notas', 'asistencia', 'vacaciones'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'info' && 'Datos'}
                {tab === 'notas' && `Notas (${notas.length})`}
                {tab === 'asistencia' && 'Historial'}
                {tab === 'vacaciones' && `Vacaciones`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {editMode ? (
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    {formData.fotoUrl ? (
                      <div className="relative">
                        <img
                          src={formData.fotoUrl}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fotoUrl: '' })}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-gray-300">
                        <Facehash name={`${formData.nombre} ${formData.apellido}`} size={80} />
                      </div>
                    )}
                    {/* Upload Button */}
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
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
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
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm divide-y">
                {talmid.fechaNacimiento && (
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Fecha de nacimiento</div>
                      <div className="font-medium">{formatDate(talmid.fechaNacimiento)}</div>
                    </div>
                  </div>
                )}
                {talmid.telefono && (
                  <a href={`tel:${talmid.telefono}`} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Telefono</div>
                      <div className="font-medium text-green-600">{talmid.telefono}</div>
                    </div>
                  </a>
                )}
                {talmid.email && (
                  <a href={`mailto:${talmid.email}`} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium text-blue-600">{talmid.email}</div>
                    </div>
                  </a>
                )}
                {!talmid.fechaNacimiento && !talmid.telefono && !talmid.email && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No hay datos adicionales</p>
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-indigo-600 mt-2"
                    >
                      Agregar datos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notas Tab */}
        {activeTab === 'notas' && (
          <div className="space-y-4">
            {/* Add Note Button */}
            {!showNotaForm && (
              <button
                onClick={() => setShowNotaForm(true)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                + Agregar nota
              </button>
            )}

            {/* Note Form */}
            {showNotaForm && (
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setNuevaNota({ ...nuevaNota, categoria: cat.value })}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        nuevaNota.categoria === cat.value
                          ? getCategoriaColor(cat.value)
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={nuevaNota.contenido}
                  onChange={(e) => setNuevaNota({ ...nuevaNota, contenido: e.target.value })}
                  placeholder="Escribi la nota..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNota}
                    disabled={!nuevaNota.contenido.trim()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setShowNotaForm(false)
                      setNuevaNota({ categoria: 'general', contenido: '' })
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Notes List */}
            {notas.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay notas registradas
              </div>
            ) : (
              <div className="space-y-3">
                {notas.map((nota) => (
                  <div key={nota.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(nota.categoria)}`}>
                        {CATEGORIAS.find((c) => c.value === nota.categoria)?.label}
                      </span>
                      <button
                        onClick={() => handleDeleteNota(nota.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-2 text-gray-700">{nota.contenido}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      {formatDate(nota.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Asistencia Tab */}
        {activeTab === 'asistencia' && (
          <div className="space-y-3">
            {asistencias.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No hay registros de asistencia
              </div>
            ) : (
              asistencias.map((a) => (
                <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{formatDate(a.fecha)}</div>
                    <div className="text-sm text-gray-500 capitalize">{a.diaSemana}</div>
                    {a.justificacion && (
                      <div className="text-sm text-red-600 mt-1">{a.justificacion}</div>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      a.estado === 'presente'
                        ? 'bg-green-100 text-green-700'
                        : a.estado === 'tardanza'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {a.estado}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Vacaciones Tab */}
        {activeTab === 'vacaciones' && (
          <div className="space-y-4">
            {/* Add Ausencia Button */}
            {!showAusenciaForm && (
              <button
                onClick={() => setShowAusenciaForm(true)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border-2 border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-600 transition"
              >
                + Agregar ausencia programada
              </button>
            )}

            {/* Ausencia Form */}
            {showAusenciaForm && (
              <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <h3 className="font-medium text-gray-800">Nueva ausencia programada</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desde
                    </label>
                    <input
                      type="date"
                      value={nuevaAusencia.fechaInicio}
                      onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta
                    </label>
                    <input
                      type="date"
                      value={nuevaAusencia.fechaFin}
                      onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, fechaFin: e.target.value })}
                      min={nuevaAusencia.fechaInicio}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>
                  <textarea
                    value={nuevaAusencia.justificacion}
                    onChange={(e) => setNuevaAusencia({ ...nuevaAusencia, justificacion: e.target.value })}
                    placeholder="Ej: Viaje familiar, vacaciones..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none text-sm"
                  />
                </div>

                {ausenciaError && (
                  <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    {ausenciaError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleAddAusencia}
                    disabled={savingAusencia}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    {savingAusencia ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAusenciaForm(false)
                      setNuevaAusencia({ fechaInicio: '', fechaFin: '', justificacion: '' })
                      setAusenciaError('')
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Ausencias List */}
            {ausencias.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🏖️</div>
                <p>No hay ausencias programadas</p>
                <p className="text-sm mt-1">
                  Registra vacaciones o ausencias planificadas para que aparezcan pre-marcadas al tomar lista
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ausencias.map((ausencia) => (
                  <div
                    key={ausencia.id}
                    className={`bg-white rounded-xl p-4 shadow-sm ${
                      !ausencia.activa ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {formatDateRange(ausencia.fechaInicio, ausencia.fechaFin)}
                          </div>
                          <div className="text-sm text-gray-600">{ausencia.justificacion}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAusencia(ausencia.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
