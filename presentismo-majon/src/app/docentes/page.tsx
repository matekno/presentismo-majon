'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Docente {
  id: string
  nombre: string
  apellido: string
  tipo: string
  cantidadClases: number
}

type Filtro = 'todos' | 'mejanej' | 'capacitador'

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [showModal, setShowModal] = useState(false)
  const [nuevoDocente, setNuevoDocente] = useState({ nombre: '', apellido: '', tipo: 'mejanej' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDocentes()
  }, [])

  const fetchDocentes = async () => {
    try {
      const res = await fetch('/api/docentes')
      const data = await res.json()
      setDocentes(data.docentes || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDocente = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoDocente.nombre || !nuevoDocente.apellido) return

    setSaving(true)
    try {
      const res = await fetch('/api/docentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoDocente),
      })

      if (res.ok) {
        const data = await res.json()
        setDocentes([...docentes, data.docente])
        setNuevoDocente({ nombre: '', apellido: '', tipo: 'mejanej' })
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const docentesFiltrados = docentes.filter(d => {
    if (filtro === 'todos') return true
    return d.tipo === filtro
  })

  const mejanjim = docentes.filter(d => d.tipo === 'mejanej')
  const capacitadores = docentes.filter(d => d.tipo === 'capacitador')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-purple-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-purple-200 hover:text-white">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold">Docentes</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filtro === 'todos'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Todos ({docentes.length})
          </button>
          <button
            onClick={() => setFiltro('mejanej')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filtro === 'mejanej'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mejanjim ({mejanjim.length})
          </button>
          <button
            onClick={() => setFiltro('capacitador')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filtro === 'capacitador'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Capacitadores ({capacitadores.length})
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <span className="text-2xl font-bold text-purple-700">{mejanjim.length}</span>
            <span className="text-purple-600 block text-sm">Mejanjim</span>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <span className="text-2xl font-bold text-blue-700">{capacitadores.length}</span>
            <span className="text-blue-600 block text-sm">Capacitadores</span>
          </div>
        </div>

        {/* Lista de docentes */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : docentesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No hay docentes registrados</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Agregar docente
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {docentesFiltrados.map((docente) => (
              <Link
                key={docente.id}
                href={`/docentes/${docente.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    docente.tipo === 'mejanej' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <span className={`font-semibold text-lg ${
                      docente.tipo === 'mejanej' ? 'text-purple-600' : 'text-blue-600'
                    }`}>
                      {docente.nombre[0]}{docente.apellido[0]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {docente.apellido}, {docente.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        docente.tipo === 'mejanej'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {docente.tipo === 'mejanej' ? 'Mejanej' : 'Capacitador'}
                      </span>
                      {docente.cantidadClases > 0 && (
                        <span className="text-sm text-gray-500">
                          {docente.cantidadClases} clase{docente.cantidadClases > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* FAB - Agregar docente */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition flex items-center justify-center"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Modal - Agregar docente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Nuevo docente</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDocente} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={nuevoDocente.nombre}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, nombre: e.target.value })}
                  placeholder="Ej: Juan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={nuevoDocente.apellido}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, apellido: e.target.value })}
                  placeholder="Ej: Perez"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={nuevoDocente.tipo}
                  onChange={(e) => setNuevoDocente({ ...nuevoDocente, tipo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="mejanej">Mejanej</option>
                  <option value="capacitador">Capacitador</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Agregar docente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
