'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface DiaStats {
  count: number
  porcentaje: number | null
}

interface ResumenResponse {
  porcentajeGlobal: number
  clasesConAsistencia: number
  promedioPorClase: number
  tendencia: { fecha: string; porcentaje: number }[]
  porDia: {
    martes: DiaStats
    viernes: DiaStats
  }
}

function barColor(pct: number) {
  if (pct >= 80) return 'bg-green-500'
  if (pct >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function ReportesResumenPage() {
  const [data, setData] = useState<ResumenResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations()

  useEffect(() => {
    fetch('/api/reportes/resumen')
      .then((res) => res.json())
      .then(setData)
      .catch((e) => console.error('Error:', e))
      .finally(() => setLoading(false))
  }, [])

  const formatFechaCorta = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const tendencia = data?.tendencia ?? []

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/reportes" className="text-blue-200 hover:text-white">
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('reportes.resumen.title')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">{t('reportes.resumen.loading')}</p>
          </div>
        ) : !data || data.clasesConAsistencia === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            {t('reportes.resumen.empty')}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-blue-700">{data.porcentajeGlobal}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('reportes.resumen.globalAttendance')}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{data.clasesConAsistencia}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('reportes.resumen.classesWithAttendance')}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{data.promedioPorClase}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('reportes.resumen.avgPerClass')}
                </div>
              </div>
            </div>

            {/* Tendencia */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-800">{t('reportes.resumen.trend.title')}</h2>
              <p className="text-xs text-gray-500 mb-3">{t('reportes.resumen.trend.subtitle')}</p>
              {tendencia.length === 0 ? (
                <p className="text-sm text-gray-400">{t('reportes.resumen.trend.empty')}</p>
              ) : (
                <>
                  <div className="flex items-end gap-0.5 h-40 border-b border-l border-gray-200 pl-1 pb-px">
                    {tendencia.map((p, i) => (
                      <div
                        key={i}
                        className="flex-1 flex items-end h-full"
                        title={`${formatFechaCorta(p.fecha)} · ${p.porcentaje}%`}
                      >
                        <div
                          className={`w-full rounded-t ${barColor(p.porcentaje)}`}
                          style={{ height: `${Math.max(p.porcentaje, 2)}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatFechaCorta(tendencia[0].fecha)}</span>
                    <span>{formatFechaCorta(tendencia[tendencia.length - 1].fecha)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Martes vs Viernes */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-semibold text-gray-800 mb-3">
                {t('reportes.resumen.byDay.title')}
              </h2>
              <div className="space-y-3">
                {(['martes', 'viernes'] as const).map((dia) => {
                  const stats = data.porDia[dia]
                  return (
                    <div key={dia}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">
                          {t(`reportes.resumen.byDay.${dia}`)}
                        </span>
                        <span className="text-gray-500">
                          {stats.porcentaje !== null
                            ? `${stats.porcentaje}% · ${t('reportes.resumen.byDay.classes', {
                                count: stats.count,
                              })}`
                            : t('reportes.resumen.byDay.noData')}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        {stats.porcentaje !== null && (
                          <div
                            className={`h-full rounded-full ${barColor(stats.porcentaje)}`}
                            style={{ width: `${stats.porcentaje}%` }}
                          ></div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
