'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Docente {
  id: string
  nombre: string
  apellido: string
  tipo: string
}

interface Clase {
  id: string
  fecha: string
  titulo: string | null
  diaSemana: string
  docentes: Docente[]
}

interface DocenteFeedback {
  docenteId: string
  rating: number
  comentario: string
}

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const claseId = params.claseId as string

  const [clase, setClase] = useState<Clase | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Estado del formulario
  const [claseRating, setClaseRating] = useState(0)
  const [claseComentario, setClaseComentario] = useState('')
  const [docentesFeedback, setDocentesFeedback] = useState<DocenteFeedback[]>([])

  useEffect(() => {
    fetchClase()
  }, [claseId])

  async function fetchClase() {
    try {
      const res = await fetch(`/api/feedback/${claseId}`)
      const data = await res.json()

      if (!res.ok) {
        if (data.alreadySubmitted) {
          router.push('/?message=already_submitted')
          return
        }
        setError(data.error || 'Error al cargar la clase')
        return
      }

      setClase(data.clase)
      // Inicializar feedback de docentes
      setDocentesFeedback(
        data.clase.docentes.map((d: Docente) => ({
          docenteId: d.id,
          rating: 0,
          comentario: ''
        }))
      )
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function updateDocenteRating(docenteId: string, rating: number) {
    setDocentesFeedback(prev =>
      prev.map(df =>
        df.docenteId === docenteId ? { ...df, rating } : df
      )
    )
  }

  function updateDocenteComentario(docenteId: string, comentario: string) {
    setDocentesFeedback(prev =>
      prev.map(df =>
        df.docenteId === docenteId ? { ...df, comentario } : df
      )
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (claseRating === 0) {
      setError('Por favor califica la clase')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claseId,
          claseRating,
          claseComentario: claseComentario.trim() || null,
          docentesFeedback: docentesFeedback.filter(df => df.rating > 0)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al enviar feedback')
        return
      }

      router.push('/?message=feedback_sent')
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (error && !clase) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-800">{error}</p>
            <Link href="/" className="text-emerald-600 mt-4 inline-block">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!clase) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex items-center">
          <Link href="/" className="mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="font-semibold">Dar feedback</h1>
            <p className="text-emerald-100 text-sm">
              {new Date(clase.fecha).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto space-y-6">
        {/* Clase info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-medium text-gray-800 mb-1">
            {clase.titulo || 'Clase de ' + clase.diaSemana}
          </h2>
          {clase.docentes.length > 0 && (
            <p className="text-sm text-gray-500">
              Con {clase.docentes.map(d => `${d.nombre} ${d.apellido}`).join(', ')}
            </p>
          )}
        </div>

        {/* Rating de la clase */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-3">¿Cómo estuvo la clase?</h3>
          <StarRating value={claseRating} onChange={setClaseRating} />
          <textarea
            value={claseComentario}
            onChange={(e) => setClaseComentario(e.target.value)}
            placeholder="Comentarios sobre la clase (opcional)"
            className="w-full mt-4 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
          />
        </div>

        {/* Rating de docentes */}
        {clase.docentes.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-800 mb-4">Evaluar docentes</h3>
            <div className="space-y-6">
              {clase.docentes.map((docente) => {
                const feedback = docentesFeedback.find(df => df.docenteId === docente.id)
                return (
                  <div key={docente.id} className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-800">
                          {docente.nombre} {docente.apellido}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">{docente.tipo}</p>
                      </div>
                    </div>
                    <StarRating
                      value={feedback?.rating || 0}
                      onChange={(rating) => updateDocenteRating(docente.id, rating)}
                      size="sm"
                    />
                    <input
                      type="text"
                      value={feedback?.comentario || ''}
                      onChange={(e) => updateDocenteComentario(docente.id, e.target.value)}
                      placeholder="Comentario (opcional)"
                      className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || claseRating === 0}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
        >
          {submitting ? 'Enviando...' : 'Enviar feedback'}
        </button>
      </form>
    </div>
  )
}

// Componente de estrellas
function StarRating({
  value,
  onChange,
  size = 'md'
}: {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md'
}) {
  const starSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`${starSize} transition-transform hover:scale-110 active:scale-95`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={star <= value ? '#10b981' : 'none'}
            stroke={star <= value ? '#10b981' : '#d1d5db'}
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
    </div>
  )
}
