'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Docente {
  nombre: string
  apellido: string
  tipo: string
}

interface ClasePlanificada {
  id: string
  fecha: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  titulo: string | null
  docentes: Docente[]
  tieneAsistencias: boolean
  cantidadAsistencias: number
}

export default function AsistenciaPage() {
  const [clases, setClases] = useState<ClasePlanificada[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClaseId, setSelectedClaseId] = useState<string | null>(null)
  const t = useTranslations()

  useEffect(() => {
    fetchClases()
  }, [])

  const fetchClases = async () => {
    try {
      const res = await fetch('/api/clases/planificadas')
      const data = await res.json()
      setClases(data.clases || [])

      // Seleccionar automaticamente la clase mas reciente que no tenga asistencia completa
      // o la primera si todas tienen
      if (data.clases?.length > 0) {
        const hoy = new Date().toISOString().split('T')[0]
        const claseHoy = data.clases.find((c: ClasePlanificada) => c.fecha === hoy)
        if (claseHoy) {
          setSelectedClaseId(claseHoy.id)
        } else {
          // Buscar la clase futura mas cercana o la pasada mas reciente
          const claseFutura = [...data.clases]
            .reverse()
            .find((c: ClasePlanificada) => c.fecha >= hoy)
          setSelectedClaseId(claseFutura?.id || data.clases[0].id)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
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

  const isHoy = (fechaStr: string) => {
    const hoy = new Date().toISOString().split('T')[0]
    return fechaStr === hoy
  }

  const isPasada = (fechaStr: string) => {
    const hoy = new Date().toISOString().split('T')[0]
    return fechaStr < hoy
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-green-200 hover:text-white">
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('asistencia.title')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">{t('asistencia.loadingClasses')}</p>
          </div>
        ) : clases.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h2 className="text-lg font-semibold text-yellow-800">{t('asistencia.noClasses.title')}</h2>
            <p className="text-yellow-700 mt-1">
              {t('asistencia.noClasses.description')}
            </p>
            <Link
              href="/cronograma"
              className="inline-block mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-6 py-2 rounded-lg transition"
            >
              {t('asistencia.noClasses.action')}
            </Link>
          </div>
        ) : (
          <>
            {/* Selector de clase */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('asistencia.selectClass')}
              </label>
              <select
                value={selectedClaseId || ''}
                onChange={(e) => setSelectedClaseId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                {clases.map((clase) => (
                  <option key={clase.id} value={clase.id}>
                    {formatFecha(clase.fecha)} - {clase.titulo || clase.docentes?.map(d => d.apellido).join(', ') || clase.diaSemana}
                    {isHoy(clase.fecha) ? ` (${t('asistencia.today')})` : ''}
                    {clase.tieneAsistencias ? ' ✓' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de clases recientes como chips */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {clases.slice(0, 6).map((clase) => (
                <button
                  key={clase.id}
                  onClick={() => setSelectedClaseId(clase.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedClaseId === clase.id
                      ? 'bg-green-600 text-white'
                      : isHoy(clase.fecha)
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : isPasada(clase.fecha) && clase.tieneAsistencias
                      ? 'bg-gray-100 text-gray-600'
                      : isPasada(clase.fecha)
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {formatFecha(clase.fecha)}
                  {clase.tieneAsistencias && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>

            {/* Clase seleccionada - Link a tomar lista */}
            {selectedClaseId && (
              <ClaseSeleccionada
                clase={clases.find((c) => c.id === selectedClaseId)!}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}

function ClaseSeleccionada({ clase }: { clase: ClasePlanificada }) {
  const t = useTranslations('asistencia')

  const formatFechaLarga = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-green-50 p-4 border-b border-green-100">
        <h2 className="font-semibold text-green-800 capitalize">
          {formatFechaLarga(clase.fecha)}
        </h2>
        <p className="text-green-600 text-sm">
          {clase.horaInicio} - {clase.horaFin}
        </p>
        {(clase.titulo || clase.docentes?.length > 0) && (
          <p className="text-green-700 mt-1">
            {clase.titulo && <span className="font-medium">{clase.titulo}</span>}
            {clase.titulo && clase.docentes?.length > 0 && <span> - </span>}
            {clase.docentes?.length > 0 && (
              <span>{clase.docentes.map(d => `${d.nombre} ${d.apellido}`).join(', ')}</span>
            )}
          </p>
        )}
      </div>

      <div className="p-4">
        {clase.tieneAsistencias ? (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{t('status.taken')}</p>
              <p className="text-sm text-gray-500">{clase.cantidadAsistencias} registros</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{t('status.pending')}</p>
              <p className="text-sm text-gray-500">{t('status.pendingDescription')}</p>
            </div>
          </div>
        )}

        <Link
          href={`/asistencia/${clase.id}`}
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
        >
          {clase.tieneAsistencias ? t('viewEdit') : t('takeAttendance')}
        </Link>
      </div>
    </div>
  )
}
