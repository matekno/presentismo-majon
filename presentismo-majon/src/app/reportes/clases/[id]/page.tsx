'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Asistencia {
  talmidId: string
  nombre: string
  apellido: string
  estado: 'presente' | 'ausente' | 'tardanza' | null
  justificacion: string | null
}

interface Docente {
  nombre: string
  apellido: string
  tipo: string
}

interface Clase {
  id: string
  fecha: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  titulo: string | null
  docentes: Docente[]
}

type Grupo = 'presente' | 'tardanza' | 'ausente' | 'sinMarcar'

const grupos: { key: Grupo; estado: Asistencia['estado']; labelKey: string; color: string; dot: string }[] = [
  { key: 'presente', estado: 'presente', labelKey: 'present', color: 'text-green-700', dot: 'bg-green-500' },
  { key: 'tardanza', estado: 'tardanza', labelKey: 'late', color: 'text-yellow-700', dot: 'bg-yellow-500' },
  { key: 'ausente', estado: 'ausente', labelKey: 'absent', color: 'text-red-700', dot: 'bg-red-500' },
  { key: 'sinMarcar', estado: null, labelKey: 'unmarked', color: 'text-gray-600', dot: 'bg-gray-400' },
]

export default function ReporteClaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [clase, setClase] = useState<Clase | null>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const t = useTranslations()

  useEffect(() => {
    fetch(`/api/clases/${id}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || t('common.error.generic'))
          return
        }
        setClase(data.clase)
        setAsistencias(data.asistencias || [])
      })
      .catch(() => setError(t('common.error.connection')))
      .finally(() => setLoading(false))
  }, [id, t])

  const formatFechaLarga = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const presentes = asistencias.filter((a) => a.estado === 'presente').length
  const tardanzas = asistencias.filter((a) => a.estado === 'tardanza').length
  const ausentes = asistencias.filter((a) => a.estado === 'ausente').length
  const registros = presentes + tardanzas + ausentes
  const porcentaje = registros > 0 ? Math.round(((presentes + tardanzas) / registros) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/reportes/clases" className="text-blue-200 hover:text-white">
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('reportes.clases.detail.title')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">{t('reportes.clases.detail.loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-center">{error}</div>
        ) : clase ? (
          <>
            {/* Class Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-semibold capitalize">
                  {formatFechaLarga(clase.fecha)}
                </span>
                <span className="text-blue-600 text-sm">
                  {clase.horaInicio} - {clase.horaFin}
                </span>
              </div>
              {(clase.titulo || clase.docentes?.length > 0) && (
                <div className="mt-2 text-sm text-blue-700">
                  {clase.titulo && <span className="font-medium">{clase.titulo}</span>}
                  {clase.titulo && clase.docentes?.length > 0 && <span> - </span>}
                  {clase.docentes?.length > 0 && (
                    <span>{clase.docentes.map((d) => `${d.nombre} ${d.apellido}`).join(', ')}</span>
                  )}
                </div>
              )}
            </div>

            {/* % del día */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex items-center justify-between">
              <span className="text-gray-600">{t('reportes.clases.detail.attendancePercent')}</span>
              <span className="text-3xl font-bold text-blue-700">{porcentaje}%</span>
            </div>

            {/* Grupos por estado */}
            <div className="space-y-4">
              {grupos.map((grupo) => {
                const miembros = asistencias.filter((a) => a.estado === grupo.estado)
                return (
                  <div key={grupo.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                      <span className={`w-2.5 h-2.5 rounded-full ${grupo.dot}`}></span>
                      <h2 className={`font-semibold ${grupo.color}`}>
                        {t(`reportes.clases.detail.${grupo.labelKey}`)}
                      </h2>
                      <span className="ml-auto text-sm font-bold text-gray-500">
                        {miembros.length}
                      </span>
                    </div>
                    {miembros.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-400">
                        {t('reportes.clases.detail.emptyGroup')}
                      </p>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {miembros.map((a) => (
                          <li key={a.talmidId} className="px-4 py-2.5">
                            <span className="text-gray-800">
                              <span className="font-medium">{a.apellido}</span>, {a.nombre}
                            </span>
                            {grupo.key === 'ausente' && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {a.justificacion || t('reportes.clases.detail.noJustification')}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
