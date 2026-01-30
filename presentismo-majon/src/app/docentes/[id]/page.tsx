'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface Docente {
  id: string
  nombre: string
  apellido: string
  tipo: string
  activo: boolean
  createdAt: string
}

interface Clase {
  id: string
  fecha: string
  diaSemana: string
  titulo: string | null
  horaInicio: string
  horaFin: string
  conAsistencia: boolean
}

interface Estadisticas {
  totalClases: number
  clasesConAsistencia: number
  porcentajeDelPeriodo: number
  ultimaClase: string | null
}

interface FeedbackItem {
  id: string
  rating: number
  comentario: string | null
  fecha: string
  claseTitulo: string | null
  talmidNombre: string
  createdAt: string
}

interface FeedbackStats {
  promedio: number
  cantidadFeedbacks: number
  feedbacks: FeedbackItem[]
}

type Tab = 'info' | 'clases' | 'feedback'

export default function DocenteFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [docente, setDocente] = useState<Docente | null>(null)
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ nombre: '', apellido: '', tipo: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDocente()
    fetchFeedback()
  }, [id])

  const fetchDocente = async () => {
    try {
      const res = await fetch(`/api/docentes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDocente(data.docente)
        setEstadisticas(data.estadisticas)
        setClases(data.clases || [])
        setFormData({
          nombre: data.docente.nombre,
          apellido: data.docente.apellido,
          tipo: data.docente.tipo
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeedback = async () => {
    try {
      const res = await fetch(`/api/feedback/docente/${id}`)
      if (res.ok) {
        const data = await res.json()
        setFeedbackStats(data)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/docentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setDocente(prev => prev ? { ...prev, ...data.docente } : null)
        setEditing(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!docente) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-purple-700 text-white sticky top-0 z-10 shadow-lg">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/docentes" className="text-purple-200 hover:text-white">
                ← Volver
              </Link>
              <h1 className="text-xl font-bold">Docente</h1>
              <div className="w-16"></div>
            </div>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-500">Docente no encontrado</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con avatar */}
      <header className="bg-purple-700 text-white">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/docentes" className="text-purple-200 hover:text-white">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold">Ficha</h1>
            <div className="w-16"></div>
          </div>
        </div>

        {/* Avatar y nombre */}
        <div className="text-center pb-6">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${
            docente.tipo === 'mejanej' ? 'bg-purple-500' : 'bg-blue-500'
          }`}>
            <span className="text-3xl font-bold text-white">
              {docente.nombre[0]}{docente.apellido[0]}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-3">{docente.nombre} {docente.apellido}</h2>
          <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm ${
            docente.tipo === 'mejanej' ? 'bg-purple-500/50' : 'bg-blue-500/50'
          }`}>
            {docente.tipo === 'mejanej' ? 'Mejanej' : 'Capacitador'}
          </span>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">{estadisticas?.totalClases || 0}</div>
              <div className="text-xs text-gray-500">Total clases</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{estadisticas?.porcentajeDelPeriodo || 0}%</div>
              <div className="text-xs text-gray-500">Del periodo</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {estadisticas?.ultimaClase ? formatDate(estadisticas.ultimaClase) : '-'}
              </div>
              <div className="text-xs text-gray-500">Ultima clase</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'info'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Datos
          </button>
          <button
            onClick={() => setActiveTab('clases')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'clases'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historial ({clases.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'feedback'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Feedback {feedbackStats?.cantidadFeedbacks ? `(${feedbackStats.cantidadFeedbacks})` : ''}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {activeTab === 'info' && (
          <div className="space-y-4">
            {!editing ? (
              <>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Nombre completo</div>
                        <div className="font-medium">{docente.nombre} {docente.apellido}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Tipo</div>
                        <div className="font-medium">{docente.tipo === 'mejanej' ? 'Mejanej' : 'Capacitador'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Registrado</div>
                        <div className="font-medium">
                          {new Date(docente.createdAt).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditing(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Editar datos
                </button>
              </>
            ) : (
              <form onSubmit={handleSave} className="bg-white rounded-xl p-4 shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  >
                    <option value="mejanej">Mejanej</option>
                    <option value="capacitador">Capacitador</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        nombre: docente.nombre,
                        apellido: docente.apellido,
                        tipo: docente.tipo
                      })
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'clases' && (
          <div className="space-y-3">
            {clases.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No tiene clases asignadas</p>
              </div>
            ) : (
              clases.map((clase) => (
                <div key={clase.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800">
                        {new Date(clase.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {clase.titulo || 'Sin titulo'} • {clase.horaInicio} - {clase.horaFin}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      clase.conAsistencia
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {clase.conAsistencia ? 'Completada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {/* Promedio */}
            {feedbackStats && feedbackStats.cantidadFeedbacks > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-4xl font-bold text-pink-600">{feedbackStats.promedio}</span>
                  <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Promedio de {feedbackStats.cantidadFeedbacks} evaluaciones</p>
              </div>
            )}

            {/* Lista de feedbacks */}
            {!feedbackStats || feedbackStats.feedbacks.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-500">Aún no tiene evaluaciones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackStats.feedbacks.map((fb) => (
                  <div key={fb.id} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800">{fb.talmidNombre}</p>
                        <p className="text-xs text-gray-500">
                          {fb.claseTitulo || 'Clase'} - {new Date(fb.fecha).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-lg">
                        <span className="font-bold text-pink-600">{fb.rating}</span>
                        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                    {fb.comentario && (
                      <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg">
                        &ldquo;{fb.comentario}&rdquo;
                      </p>
                    )}
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
