'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Docente {
  id: string
  nombre: string
  apellido: string
}

interface Clase {
  id: string
  fecha: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  titulo: string | null
  docente: Docente | null
  cancelada: boolean
  motivo: string | null
  tieneAsistencias: boolean
}

interface Feriado {
  id: string
  fecha: string
  nombre: string
  tipo: string
}

interface DiaCalendario {
  fecha: string
  dia: number
  esMes: boolean
  esHoy: boolean
  esDiaClase: boolean
  clase?: Clase
  feriado?: Feriado
}

function getMesAnio(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function generarDiasCalendario(mes: string, clases: Clase[], feriados: Feriado[]): DiaCalendario[] {
  const [year, month] = mes.split('-').map(Number)
  const primerDia = new Date(year, month - 1, 1)
  const ultimoDia = new Date(year, month, 0)
  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  const dias: DiaCalendario[] = []

  // Dias del mes anterior para completar la primera semana
  const primerDiaSemana = primerDia.getDay()
  for (let i = primerDiaSemana; i > 0; i--) {
    const fecha = new Date(year, month - 1, 1 - i)
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    dias.push({
      fecha: fechaStr,
      dia: fecha.getDate(),
      esMes: false,
      esHoy: false,
      esDiaClase: fecha.getDay() === 2 || fecha.getDay() === 5,
    })
  }

  // Dias del mes actual
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = new Date(year, month - 1, dia)
    const fechaStr = `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    const dayOfWeek = fecha.getDay()
    const esDiaClase = dayOfWeek === 2 || dayOfWeek === 5

    const clase = clases.find((c) => c.fecha === fechaStr)
    const feriado = feriados.find((f) => f.fecha === fechaStr)

    dias.push({
      fecha: fechaStr,
      dia,
      esMes: true,
      esHoy: fechaStr === hoyStr,
      esDiaClase,
      clase,
      feriado,
    })
  }

  // Dias del mes siguiente para completar la ultima semana
  const diasRestantes = 7 - (dias.length % 7)
  if (diasRestantes < 7) {
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(year, month, i)
      const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
      dias.push({
        fecha: fechaStr,
        dia: i,
        esMes: false,
        esHoy: false,
        esDiaClase: fecha.getDay() === 2 || fecha.getDay() === 5,
      })
    }
  }

  return dias
}

export default function CronogramaPage() {
  const [mesActual, setMesActual] = useState(getMesAnio(new Date()))
  const [clases, setClases] = useState<Clase[]>([])
  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDia, setSelectedDia] = useState<DiaCalendario | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    docenteId: '',
    horaInicio: '',
    horaFin: '',
  })
  const [saving, setSaving] = useState(false)
  const [showDocenteForm, setShowDocenteForm] = useState(false)
  const [nuevoDocente, setNuevoDocente] = useState({ nombre: '', apellido: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cronogramaRes, docentesRes] = await Promise.all([
        fetch(`/api/cronograma?mes=${mesActual}`),
        fetch('/api/docentes'),
      ])

      const cronogramaData = await cronogramaRes.json()
      const docentesData = await docentesRes.json()

      setClases(cronogramaData.clases || [])
      setFeriados(cronogramaData.feriados || [])
      setDocentes(docentesData.docentes || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [mesActual])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const cambiarMes = (delta: number) => {
    const [year, month] = mesActual.split('-').map(Number)
    const newDate = new Date(year, month - 1 + delta, 1)
    setMesActual(getMesAnio(newDate))
  }

  const formatMes = (mes: string) => {
    const [year, month] = mes.split('-').map(Number)
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }

  const handleDiaClick = (dia: DiaCalendario) => {
    if (!dia.esMes || !dia.esDiaClase || dia.feriado) return

    setSelectedDia(dia)
    if (dia.clase) {
      setFormData({
        titulo: dia.clase.titulo || '',
        docenteId: dia.clase.docente?.id || '',
        horaInicio: dia.clase.horaInicio,
        horaFin: dia.clase.horaFin,
      })
    } else {
      const [, , dayStr] = dia.fecha.split('-')
      const [yearNum, monthNum] = mesActual.split('-').map(Number)
      const fecha = new Date(yearNum, monthNum - 1, parseInt(dayStr))
      const isMartes = fecha.getDay() === 2

      setFormData({
        titulo: '',
        docenteId: '',
        horaInicio: isMartes ? '18:30' : '17:30',
        horaFin: isMartes ? '20:30' : '21:00',
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDia) return

    setSaving(true)
    try {
      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: selectedDia.fecha,
          titulo: formData.titulo || null,
          docenteId: formData.docenteId || null,
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const docente = formData.docenteId
          ? docentes.find(d => d.id === formData.docenteId) || null
          : null

        const nuevaClase: Clase = {
          id: data.clase?.id || selectedDia.clase?.id || '',
          fecha: selectedDia.fecha,
          diaSemana: selectedDia.fecha.includes('2') ? 'martes' : 'viernes',
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin,
          titulo: formData.titulo || null,
          docente,
          cancelada: false,
          motivo: null,
          tieneAsistencias: selectedDia.clase?.tieneAsistencias || false,
        }

        // Actualizar estado local inmediatamente
        if (selectedDia.clase) {
          // Actualizar clase existente
          setClases(prev => prev.map(c => c.id === selectedDia.clase!.id ? nuevaClase : c))
        } else {
          // Agregar nueva clase
          setClases(prev => [...prev, nuevaClase])
        }
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDia?.clase) return
    if (!confirm('Eliminar esta clase?')) return

    setSaving(true)
    try {
      const res = await fetch('/api/cronograma', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedDia.clase.id }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.deleted) {
          // Eliminar del estado local
          setClases(prev => prev.filter(c => c.id !== selectedDia.clase!.id))
        } else if (data.cancelled) {
          // Marcar como cancelada en el estado local
          setClases(prev => prev.map(c =>
            c.id === selectedDia.clase!.id ? { ...c, cancelada: true } : c
          ))
        }
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddDocente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoDocente.nombre || !nuevoDocente.apellido) return

    try {
      const res = await fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoDocente),
      })

      if (res.ok) {
        const data = await res.json()
        setDocentes([...docentes, data.docente])
        setFormData({ ...formData, docenteId: data.docente.id })
        setNuevoDocente({ nombre: '', apellido: '' })
        setShowDocenteForm(false)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const dias = generarDiasCalendario(mesActual, clases, feriados)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-200 hover:text-white">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold">Cronograma</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Month Navigation */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => cambiarMes(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold capitalize">{formatMes(mesActual)}</h2>
            <button
              onClick={() => cambiarMes(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-600">Clase planificada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-400"></div>
            <span className="text-gray-600">Feriado</span>
          </div>
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Dias de la semana */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map((dia) => (
                <div
                  key={dia}
                  className={`py-2 text-center text-sm font-medium ${
                    dia === 'Mar' || dia === 'Vie' ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Dias del calendario */}
            <div className="grid grid-cols-7">
              {dias.map((dia, index) => (
                <button
                  key={index}
                  onClick={() => handleDiaClick(dia)}
                  disabled={!dia.esMes || !dia.esDiaClase || !!dia.feriado}
                  className={`
                    aspect-square p-1 border-b border-r relative
                    ${!dia.esMes ? 'bg-gray-50 text-gray-300' : ''}
                    ${dia.esMes && dia.esDiaClase && !dia.feriado ? 'hover:bg-blue-50 cursor-pointer' : ''}
                    ${dia.esHoy ? 'ring-2 ring-blue-500 ring-inset' : ''}
                  `}
                >
                  <span
                    className={`
                      text-sm
                      ${dia.esMes && dia.esDiaClase ? 'font-medium' : ''}
                      ${dia.feriado ? 'text-purple-600' : ''}
                    `}
                  >
                    {dia.dia}
                  </span>

                  {/* Indicador de clase */}
                  {dia.clase && !dia.clase.cancelada && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-blue-500 text-white text-xs rounded px-1 py-0.5 truncate">
                        {dia.clase.titulo || dia.clase.docente?.apellido || 'Clase'}
                      </div>
                    </div>
                  )}

                  {/* Indicador de feriado */}
                  {dia.feriado && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-purple-400 text-white text-xs rounded px-1 py-0.5 truncate">
                        {dia.feriado.nombre}
                      </div>
                    </div>
                  )}

                  {/* Indicador de clase cancelada */}
                  {dia.clase?.cancelada && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-red-400 text-white text-xs rounded px-1 py-0.5 truncate line-through">
                        Cancelada
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {clases.filter((c) => !c.cancelada).length}
              </div>
              <div className="text-sm text-gray-500">Clases planificadas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {clases.filter((c) => c.tieneAsistencias).length}
              </div>
              <div className="text-sm text-gray-500">Con asistencia</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{feriados.length}</div>
              <div className="text-sm text-gray-500">Feriados</div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedDia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {selectedDia.clase ? 'Editar clase' : 'Nueva clase'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="text-sm text-gray-500 mb-4">
                {new Date(selectedDia.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titulo / Tema
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Parashat Hashavua"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Docente
                </label>
                {!showDocenteForm ? (
                  <div className="flex gap-2">
                    <select
                      value={formData.docenteId}
                      onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Sin asignar</option>
                      {docentes.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre} {d.apellido}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowDocenteForm(true)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                    <input
                      type="text"
                      value={nuevoDocente.nombre}
                      onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombre: e.target.value })}
                      placeholder="Nombre"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={nuevoDocente.apellido}
                      onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellido: e.target.value })}
                      placeholder="Apellido"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddDocente}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
                      >
                        Agregar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDocenteForm(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                {selectedDia.clase && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
