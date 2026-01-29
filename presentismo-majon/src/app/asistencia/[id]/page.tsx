'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import AsistenciaItem from '@/components/AsistenciaItem'

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
  cancelada: boolean
}

export default function TomarAsistenciaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [clase, setClase] = useState<Clase | null>(null)
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClase()
  }, [id])

  const fetchClase = async () => {
    try {
      const res = await fetch(`/api/clases/${id}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al cargar la clase')
        return
      }

      setClase(data.clase)
      setAsistencias(data.asistencias || [])
    } catch {
      setError('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  // Actualizar estado local sin recargar
  const handleEstadoChange = (
    talmidId: string,
    estado: Asistencia['estado'],
    justificacion: string | null
  ) => {
    setAsistencias((prev) =>
      prev.map((a) =>
        a.talmidId === talmidId ? { ...a, estado, justificacion } : a
      )
    )
  }

  const contarAsistencias = () => {
    return asistencias.reduce(
      (acc, a) => {
        if (a.estado === 'presente') acc.presentes++
        else if (a.estado === 'tardanza') acc.tardanzas++
        else if (a.estado === 'ausente') acc.ausentes++
        else acc.sinMarcar++
        return acc
      },
      { presentes: 0, tardanzas: 0, ausentes: 0, sinMarcar: 0 }
    )
  }

  const formatFechaLarga = (fechaStr: string) => {
    const [year, month, day] = fechaStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  const stats = contarAsistencias()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/asistencia" className="text-green-200 hover:text-white">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold">Tomar lista</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        ) : clase ? (
          <>
            {/* Class Info */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-green-800 font-semibold capitalize">
                    {formatFechaLarga(clase.fecha)}
                  </span>
                </div>
                <span className="text-green-600 text-sm">
                  {clase.horaInicio} - {clase.horaFin}
                </span>
              </div>
              {(clase.titulo || clase.docentes?.length > 0) && (
                <div className="mt-2 text-sm text-green-700">
                  {clase.titulo && (
                    <span className="font-medium">{clase.titulo}</span>
                  )}
                  {clase.titulo && clase.docentes?.length > 0 && <span> - </span>}
                  {clase.docentes?.length > 0 && (
                    <span>
                      {clase.docentes.map(d => `${d.nombre} ${d.apellido}`).join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stats - sticky para verlo mientras scrolleamos */}
            <div className="grid grid-cols-4 gap-2 mb-4 sticky top-16 z-5 bg-gray-100 py-2">
              <div className="bg-green-100 rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-700">
                  {stats.presentes}
                </div>
                <div className="text-xs text-green-600">Presentes</div>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-yellow-700">
                  {stats.tardanzas}
                </div>
                <div className="text-xs text-yellow-600">Tardanzas</div>
              </div>
              <div className="bg-red-100 rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-red-700">
                  {stats.ausentes}
                </div>
                <div className="text-xs text-red-600">Ausentes</div>
              </div>
              <div className="bg-gray-200 rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-700">
                  {stats.sinMarcar}
                </div>
                <div className="text-xs text-gray-600">Sin marcar</div>
              </div>
            </div>

            {/* Attendance List */}
            <div className="space-y-3">
              {asistencias.map((asistencia) => (
                <AsistenciaItem
                  key={asistencia.talmidId}
                  talmidId={asistencia.talmidId}
                  nombre={asistencia.nombre}
                  apellido={asistencia.apellido}
                  estadoInicial={asistencia.estado}
                  justificacionInicial={asistencia.justificacion}
                  claseId={clase.id}
                  onEstadoChange={handleEstadoChange}
                />
              ))}
            </div>

            {/* Resumen final */}
            {stats.sinMarcar === 0 && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-green-800 font-medium">Lista completa!</p>
                <p className="text-green-600 text-sm mt-1">
                  Todos los alumnos fueron marcados
                </p>
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
