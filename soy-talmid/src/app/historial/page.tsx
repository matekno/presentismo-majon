'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface FeedbackItem {
  id: string
  claseRating: number
  claseComentario: string | null
  createdAt: string
  clase: {
    fecha: string
    titulo: string | null
  }
}

export default function HistorialPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    fetchHistorial()
  }, [])

  async function fetchHistorial() {
    try {
      const res = await fetch('/api/historial')
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data.feedbacks || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

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
          <h1 className="font-semibold">{t('historial.title')}</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-gray-600">{t('historial.empty')}</p>
            <Link href="/" className="text-emerald-600 text-sm mt-4 inline-block">
              {t('common.backToHome')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      {feedback.clase.titulo || t('common.class')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(feedback.clase.fecha).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center bg-emerald-50 px-2 py-1 rounded-lg">
                    <span className="text-emerald-700 font-medium">{feedback.claseRating}</span>
                    <svg className="w-4 h-4 text-emerald-500 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
                {feedback.claseComentario && (
                  <p className="text-sm text-gray-600 italic mt-2">
                    &ldquo;{feedback.claseComentario}&rdquo;
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {t('historial.sent')} {new Date(feedback.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
