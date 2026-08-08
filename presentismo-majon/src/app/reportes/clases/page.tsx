'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ClaseReporte {
  id: string
  tipo: string
  fecha: string
  diaSemana: string
  titulo: string | null
  docentes: { nombre: string; apellido: string }[]
  presentes: number
  tardanzas: number
  ausentes: number
  sinRegistro: number
  justificadas: number
  totalComputables: number
  porcentajeAsistencia: number
  tieneAsistencias: boolean
}

interface Response {
  totalTalmidim: number
  clases: ClaseReporte[]
}

export default function ReportesClasesPage() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    fetch('/api/reportes/clases')
      .then((res) => res.json())
      .then(setData)
      .catch((e) => console.error('Error:', e))
      .finally(() => setLoading(false))
  }, [])

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatFecha = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-AR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  const conAsistencia = data?.clases.filter((c) => c.tieneAsistencias).length ?? 0

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/reportes" className="text-blue-200 hover:text-white">
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('reportes.clases.title')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">{t('reportes.clases.loading')}</p>
          </div>
        ) : !data || data.clases.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            {t('reportes.clases.empty')}
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-700">{conAsistencia}</div>
                <div className="text-gray-600">{t('reportes.clases.totalLabel')}</div>
              </div>
            </div>

            {/* Lista de clases */}
            <div className="space-y-3">
              {data.clases.map((clase) => (
                <Link
                  key={clase.id}
                  href={`/reportes/clases/${clase.id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 capitalize">
                        {formatFecha(clase.fecha)}
                        {clase.tipo === 'evento' && (
                          <span className="ml-2 text-xs font-medium text-amber-600">
                            ★ {t('reportes.clases.event')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {clase.titulo ||
                          clase.docentes.map((d) => d.apellido).join(', ') ||
                          clase.diaSemana}
                      </div>
                    </div>
                    {clase.tieneAsistencias ? (
                      <div
                        className={`px-3 py-1 rounded-full font-bold flex-shrink-0 ${getColorByPercentage(
                          clase.porcentajeAsistencia
                        )}`}
                      >
                        {clase.porcentajeAsistencia}%
                      </div>
                    ) : (
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 flex-shrink-0">
                        {t('reportes.clases.noAttendance')}
                      </div>
                    )}
                  </div>

                  {clase.tieneAsistencias && (
                    <div className="mt-3 flex gap-4 text-sm">
                      <div className="text-green-600">
                        <span className="font-semibold">{clase.presentes}</span> {t('reportes.stats.present')}
                      </div>
                      <div className="text-yellow-600">
                        <span className="font-semibold">{clase.tardanzas}</span> {t('reportes.stats.late')}
                      </div>
                      <div className="text-red-600">
                        <span className="font-semibold">{clase.ausentes}</span> {t('reportes.stats.absent')}
                      </div>
                      {clase.sinRegistro > 0 && (
                        <div className="text-orange-600">
                          <span className="font-semibold">{clase.sinRegistro}</span> {t('reportes.stats.unmarked')}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
