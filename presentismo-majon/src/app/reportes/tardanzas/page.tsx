'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface RankingItem {
  id: string
  nombre: string
  apellido: string
  tardanzas: number
  justificadas: number
  injustificadas: number
}

interface TardanzasResponse {
  summary: {
    justificadas: number
    injustificadas: number
    tardanzas: number
  }
  ranking: RankingItem[]
}

export default function ReportesTardanzasPage() {
  const [data, setData] = useState<TardanzasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    fetch('/api/reportes/tardanzas')
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
            <h1 className="text-xl font-bold">{t('reportes.tardanzas.title')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">{t('reportes.tardanzas.loading')}</p>
          </div>
        ) : !data ? (
          <div className="text-center text-gray-600">{t('common.error.generic')}</div>
        ) : (
          <div className="space-y-4">
            {/* Resumen de ausencias */}
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">
                {t('reportes.tardanzas.summary.title')}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.summary.justificadas}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('reportes.tardanzas.summary.justified')}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {data.summary.injustificadas}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('reportes.tardanzas.summary.unjustified')}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {data.summary.tardanzas}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('reportes.tardanzas.summary.lateTotal')}
                  </div>
                </div>
              </div>
            </div>

            {/* Ranking de tardanzas */}
            <div>
              <h2 className="text-sm font-semibold text-gray-600 mb-2">
                {t('reportes.tardanzas.ranking.title')}
              </h2>
              {data.ranking.length === 0 ? (
                <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
                  {t('reportes.tardanzas.ranking.empty')}
                </div>
              ) : (
                <div className="space-y-3">
                  {data.ranking.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <span className="font-semibold text-gray-800">{item.apellido}</span>
                          <span className="text-gray-600">, {item.nombre}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('reportes.tardanzas.ranking.absences', {
                            justified: item.justificadas,
                            unjustified: item.injustificadas,
                          })}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xl font-bold text-yellow-600">{item.tardanzas}</div>
                        <div className="text-xs text-gray-400">{t('reportes.stats.late')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
