'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Alerta {
  id: string
  nombre: string
  apellido: string
  presentes: number
  tardanzas: number
  ausentes: number
  totalRegistros: number
  porcentaje: number
  rachaActual: number
  motivos: ('low' | 'streak')[]
}

interface AlertasResponse {
  umbral: number
  rachaMin: number
  totalClases: number
  alertas: Alerta[]
}

export default function ReportesAlertasPage() {
  const [data, setData] = useState<AlertasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    fetch('/api/reportes/alertas')
      .then((res) => res.json())
      .then(setData)
      .catch((e) => console.error('Error:', e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/reportes" className="text-blue-200 hover:text-white">
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('reportes.alertas.title')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">{t('reportes.alertas.loading')}</p>
          </div>
        ) : !data ? (
          <div className="text-center text-gray-600">{t('common.error.generic')}</div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {t('reportes.alertas.subtitle', {
                threshold: data.umbral,
                streak: data.rachaMin,
              })}
            </p>

            {data.alertas.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-800 font-medium">{t('reportes.alertas.empty')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-red-400"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-800">{alerta.apellido}</span>
                        <span className="text-gray-600">, {alerta.nombre}</span>
                      </div>
                      <div className="px-3 py-1 rounded-full font-bold bg-red-100 text-red-600 flex-shrink-0">
                        {alerta.porcentaje}%
                      </div>
                    </div>

                    {/* Motivos */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {alerta.motivos.includes('low') && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-50 text-red-600">
                          {t('reportes.alertas.reasonLow', { percent: alerta.porcentaje })}
                        </span>
                      )}
                      {alerta.motivos.includes('streak') && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                          {t('reportes.alertas.reasonStreak', { count: alerta.rachaActual })}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {t('reportes.alertas.ofClasses', {
                        taken: alerta.totalRegistros,
                        total: data.totalClases,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
