'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface Docente {
  id: string
  nombre: string
  apellido: string
  tipo: string
}

interface Kita {
  id: string
  nombre: string
  nombreDisplay: string
  colorHex: string
}

interface Clase {
  id: string
  fecha: string
  diaSemana: string
  horaInicio: string
  horaFin: string
  titulo: string | null
  docentes: Docente[]
  kitot: Kita[]
  esCompartida: boolean
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
    docenteIds: [] as string[],
    horaInicio: '',
    horaFin: '',
    esCompartida: false,
    kitaIds: [] as string[],
  })
  const [kitot, setKitot] = useState<Kita[]>([])
  const [currentKitaId, setCurrentKitaId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [showDocenteForm, setShowDocenteForm] = useState(false)
  const [nuevoDocente, setNuevoDocente] = useState({ nombre: '', apellido: '', tipo: 'capacitador' })
  const [docenteSearch, setDocenteSearch] = useState('')
  const [conflictos, setConflictos] = useState<Array<{
    id: string
    titulo: string | null
    kitot: Kita[]
    docentes: Array<{ nombre: string; apellido: string }>
  }>>([])
  const [checkingConflictos, setCheckingConflictos] = useState(false)
  const [showConflictoWarning, setShowConflictoWarning] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cronogramaRes, docentesRes, kitotRes, sessionRes] = await Promise.all([
        fetch(`/api/cronograma?mes=${mesActual}`),
        fetch('/api/docentes'),
        fetch('/api/kitot'),
        fetch('/api/auth/session'),
      ])

      const cronogramaData = await cronogramaRes.json()
      const docentesData = await docentesRes.json()
      const kitotData = await kitotRes.json()
      const sessionData = await sessionRes.json()

      setClases(cronogramaData.clases || [])
      setFeriados(cronogramaData.feriados || [])
      setDocentes(docentesData.docentes || [])
      setKitot(kitotData.kitot || [])
      if (sessionData.kita) {
        setCurrentKitaId(sessionData.kita.id)
      }
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
      const claseKitaIds = dia.clase.kitot?.map(k => k.id) || []
      setFormData({
        titulo: dia.clase.titulo || '',
        docenteIds: dia.clase.docentes?.map(d => d.id) || [],
        horaInicio: dia.clase.horaInicio,
        horaFin: dia.clase.horaFin,
        esCompartida: dia.clase.esCompartida || false,
        kitaIds: claseKitaIds,
      })
    } else {
      const [, , dayStr] = dia.fecha.split('-')
      const [yearNum, monthNum] = mesActual.split('-').map(Number)
      const fecha = new Date(yearNum, monthNum - 1, parseInt(dayStr))
      const isMartes = fecha.getDay() === 2

      setFormData({
        titulo: '',
        docenteIds: [],
        horaInicio: isMartes ? '18:30' : '17:30',
        horaFin: isMartes ? '20:30' : '21:00',
        esCompartida: false,
        kitaIds: [],
      })
    }
    setShowModal(true)
  }

  const toggleDocente = (docenteId: string) => {
    setFormData(prev => ({
      ...prev,
      docenteIds: prev.docenteIds.includes(docenteId)
        ? prev.docenteIds.filter(id => id !== docenteId)
        : [...prev.docenteIds, docenteId]
    }))
  }

  const toggleKita = async (kitaId: string) => {
    // No permitir deseleccionar la kitá actual
    if (kitaId === currentKitaId) return

    const newKitaIds = formData.kitaIds.includes(kitaId)
      ? formData.kitaIds.filter(id => id !== kitaId)
      : [...formData.kitaIds, kitaId]

    setFormData(prev => ({
      ...prev,
      kitaIds: newKitaIds
    }))

    // Verificar conflictos si se agregó una kitá
    if (!formData.kitaIds.includes(kitaId) && selectedDia) {
      await checkConflictos(selectedDia.fecha, newKitaIds)
    } else {
      // Si se quitó, limpiar conflictos
      setConflictos([])
      setShowConflictoWarning(false)
    }
  }

  const handleToggleCompartida = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      esCompartida: checked,
      // Si se activa, preseleccionar la kitá actual
      kitaIds: checked ? [currentKitaId] : []
    }))
    // Limpiar conflictos al desactivar
    if (!checked) {
      setConflictos([])
      setShowConflictoWarning(false)
    }
  }

  const checkConflictos = async (fecha: string, kitaIds: string[]) => {
    if (kitaIds.length <= 1) {
      setConflictos([])
      return
    }

    setCheckingConflictos(true)
    try {
      const res = await fetch('/api/cronograma/conflictos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, kitaIds }),
      })
      const data = await res.json()
      setConflictos(data.conflictos || [])
      if (data.conflictos && data.conflictos.length > 0) {
        setShowConflictoWarning(true)
      }
    } catch (error) {
      console.error('Error verificando conflictos:', error)
    } finally {
      setCheckingConflictos(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDia) return

    setSaving(true)
    try {
      // Si es compartida, enviar kitaIds; si no, el backend usará la kitá actual
      const kitaIds = formData.esCompartida ? formData.kitaIds : undefined

      const res = await fetch('/api/cronograma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: selectedDia.fecha,
          titulo: formData.titulo || null,
          docenteIds: formData.docenteIds,
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin,
          kitaIds,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const docentesSeleccionados = formData.docenteIds
          .map(id => docentes.find(d => d.id === id))
          .filter((d): d is Docente => d !== undefined)

        // Determinar las kitot de la clase
        const kitotSeleccionadas = formData.esCompartida
          ? formData.kitaIds.map(id => kitot.find(k => k.id === id)).filter((k): k is Kita => k !== undefined)
          : kitot.filter(k => k.id === currentKitaId)

        const nuevaClase: Clase = {
          id: data.clase?.id || selectedDia.clase?.id || '',
          fecha: selectedDia.fecha,
          diaSemana: selectedDia.fecha.includes('2') ? 'martes' : 'viernes',
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin,
          titulo: formData.titulo || null,
          docentes: docentesSeleccionados,
          kitot: kitotSeleccionadas,
          esCompartida: kitotSeleccionadas.length > 1,
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
        setFormData({ ...formData, docenteIds: [...formData.docenteIds, data.docente.id] })
        setNuevoDocente({ nombre: '', apellido: '', tipo: 'capacitador' })
        setShowDocenteForm(false)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const dias = generarDiasCalendario(mesActual, clases, feriados)

  // Filtrar y separar docentes por tipo
  const filteredDocentes = docentes.filter(d => {
    if (!docenteSearch.trim()) return true
    const search = docenteSearch.toLowerCase()
    return d.nombre.toLowerCase().includes(search) || d.apellido.toLowerCase().includes(search)
  })
  const mejanjim = filteredDocentes.filter(d => d.tipo === 'mejanej')
  const capacitadores = filteredDocentes.filter(d => d.tipo === 'capacitador')

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
                        {dia.clase.titulo ||
                         dia.clase.docentes?.map(d => d.apellido).join(', ') ||
                         'Clase'}
                      </div>
                      {/* Indicador de clase compartida: puntos de colores */}
                      {dia.clase.esCompartida && dia.clase.kitot && dia.clase.kitot.length > 1 && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {dia.clase.kitot.map(k => (
                            <div
                              key={k.id}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: k.colorHex }}
                              title={k.nombreDisplay}
                            />
                          ))}
                        </div>
                      )}
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Docentes
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDocenteForm(!showDocenteForm)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Agregar nuevo
                  </button>
                </div>

                {showDocenteForm && (
                  <div className="space-y-2 bg-blue-50 p-3 rounded-lg mb-3">
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
                    <select
                      value={nuevoDocente.tipo}
                      onChange={(e) => setNuevoDocente({ ...nuevoDocente, tipo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="mejanej">Mejanej</option>
                      <option value="capacitador">Capacitador</option>
                    </select>
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

                {/* Barra de búsqueda */}
                <div className="relative mb-3">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={docenteSearch}
                    onChange={(e) => setDocenteSearch(e.target.value)}
                    placeholder="Buscar docente..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  {docenteSearch && (
                    <button
                      type="button"
                      onClick={() => setDocenteSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {/* Mejanjim */}
                  {mejanjim.length > 0 && (
                    <div className="border-b border-gray-200">
                      <div className="bg-purple-50 px-3 py-2 sticky top-0">
                        <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Mejanjim</span>
                        <span className="ml-2 text-xs text-purple-500">({mejanjim.length})</span>
                      </div>
                      <div className="p-2 space-y-1">
                        {mejanjim.map(d => (
                          <label key={d.id} className="flex items-center gap-3 py-2 px-2 cursor-pointer hover:bg-purple-50 rounded-lg transition">
                            <input
                              type="checkbox"
                              checked={formData.docenteIds.includes(d.id)}
                              onChange={() => toggleDocente(d.id)}
                              className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-purple-600">{d.nombre[0]}{d.apellido[0]}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{d.nombre} {d.apellido}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Capacitadores */}
                  {capacitadores.length > 0 && (
                    <div>
                      <div className="bg-blue-50 px-3 py-2 sticky top-0">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Capacitadores</span>
                        <span className="ml-2 text-xs text-blue-500">({capacitadores.length})</span>
                      </div>
                      <div className="p-2 space-y-1">
                        {capacitadores.map(d => (
                          <label key={d.id} className="flex items-center gap-3 py-2 px-2 cursor-pointer hover:bg-blue-50 rounded-lg transition">
                            <input
                              type="checkbox"
                              checked={formData.docenteIds.includes(d.id)}
                              onChange={() => toggleDocente(d.id)}
                              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">{d.nombre[0]}{d.apellido[0]}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-700">{d.nombre} {d.apellido}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {docentes.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No hay docentes registrados
                    </div>
                  )}

                  {docentes.length > 0 && filteredDocentes.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No se encontraron docentes con "{docenteSearch}"
                    </div>
                  )}
                </div>

                {formData.docenteIds.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {formData.docenteIds.length} docente{formData.docenteIds.length > 1 ? 's' : ''} seleccionado{formData.docenteIds.length > 1 ? 's' : ''}
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

              {/* Clase compartida */}
              {kitot.length > 1 && (
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.esCompartida}
                      onChange={(e) => handleToggleCompartida(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Clase compartida entre kitot</span>
                  </label>

                  {formData.esCompartida && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {kitot.map(k => {
                        const isSelected = formData.kitaIds.includes(k.id)
                        const isCurrent = k.id === currentKitaId
                        return (
                          <button
                            key={k.id}
                            type="button"
                            onClick={() => toggleKita(k.id)}
                            disabled={isCurrent || checkingConflictos}
                            className={`
                              px-3 py-2 rounded-full text-sm font-medium transition-all
                              ${isSelected
                                ? 'text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }
                              ${isCurrent ? 'opacity-100 cursor-default' : 'cursor-pointer'}
                            `}
                            style={isSelected ? { backgroundColor: k.colorHex } : undefined}
                          >
                            {k.nombreDisplay}
                            {isCurrent && <span className="ml-1 text-xs">(actual)</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Advertencia de conflictos */}
                  {formData.esCompartida && conflictos.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1 text-sm">
                          <p className="font-medium text-amber-800">
                            {conflictos.length === 1 ? 'Ya existe una clase' : `Existen ${conflictos.length} clases`} para este día:
                          </p>
                          <ul className="mt-1 space-y-1">
                            {conflictos.map(c => (
                              <li key={c.id} className="text-amber-700">
                                <span className="font-medium">{c.kitot.map(k => k.nombreDisplay).join(', ')}</span>
                                {c.titulo && <span>: {c.titulo}</span>}
                                {c.docentes.length > 0 && (
                                  <span className="text-amber-600"> ({c.docentes.map(d => d.apellido).join(', ')})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-amber-600 text-xs">
                            Podés continuar igualmente. Las clases coexistirán.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {checkingConflictos && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      Verificando conflictos...
                    </div>
                  )}
                </div>
              )}

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
