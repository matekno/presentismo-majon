'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DocenteRanking {
  id: string
  nombre: string
  apellido: string
  promedio: number
  cantidadFeedbacks: number
}

interface FeedbackReciente {
  id: string
  claseRating: number
  claseComentario: string | null
  createdAt: string
  talmid: { nombre: string; apellido: string }
  clase: { fecha: string; titulo: string | null }
  docentesFeedback: Array<{ docenteId: string; rating: number; comentario?: string }>
}

interface Stats {
  totalFeedbacks: number
  promedioClase: number
}

export default function FeedbackPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [docentesRanking, setDocentesRanking] = useState<DocenteRanking[]>([])
  const [feedbacksRecientes, setFeedbacksRecientes] = useState<FeedbackReciente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    try {
      const res = await fetch('/api/feedback')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setDocentesRanking(data.docentesRanking || [])
        setFeedbacksRecientes(data.feedbacksRecientes || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-pink-800 to-pink-700">
      {/* Header */}
      <header className="pt-8 pb-4 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="text-pink-200 hover:text-white mb-4 inline-flex items-center gap-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <h1 className="text-3xl font-bold text-white">Feedback</h1>
          <p className="text-pink-200">Evaluaciones de los talmidim</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats generales */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <p className="text-3xl font-bold text-pink-600">{stats.totalFeedbacks}</p>
              <p className="text-gray-500 text-sm">Feedbacks totales</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg text-center">
              <div className="flex items-center justify-center gap-1">
                <p className="text-3xl font-bold text-pink-600">{stats.promedioClase}</p>
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Promedio clases</p>
            </div>
          </div>
        )}

        {/* Ranking de docentes */}
        {docentesRanking.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Ranking de docentes
            </h2>
            <div className="space-y-3">
              {docentesRanking.map((docente, index) => (
                <Link
                  key={docente.id}
                  href={`/docentes/${docente.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-amber-600' :
                    'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {docente.nombre} {docente.apellido}
                    </p>
                    <p className="text-xs text-gray-500">
                      {docente.cantidadFeedbacks} evaluaciones
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full">
                    <span className="font-bold text-pink-600">{docente.promedio}</span>
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feedbacks recientes */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Feedbacks recientes
          </h2>

          {feedbacksRecientes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-500">Aún no hay feedbacks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacksRecientes.map((feedback) => (
                <div key={feedback.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        {feedback.talmid.nombre} {feedback.talmid.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        {feedback.clase.titulo || 'Clase'} - {new Date(feedback.clase.fecha).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-pink-50 px-2 py-1 rounded-lg">
                      <span className="font-bold text-pink-600 text-sm">{feedback.claseRating}</span>
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                  </div>
                  {feedback.claseComentario && (
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded-lg">
                      &ldquo;{feedback.claseComentario}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(feedback.createdAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
