'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Facehash } from 'facehash'

interface Talmid {
  id: string
  nombre: string
  apellido: string
  fechaNacimiento: string | null
  telefono: string | null
  email: string | null
  fotoUrl: string | null
  cantidadAsistencias: number
  cantidadNotas: number
}

export default function TalmidimPage() {
  const [talmidim, setTalmidim] = useState<Talmid[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTalmidim()
  }, [])

  const fetchTalmidim = async () => {
    try {
      const res = await fetch('/api/talmidim')
      const data = await res.json()
      setTalmidim(data.talmidim || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTalmidim = talmidim.filter((t) =>
    `${t.nombre} ${t.apellido}`.toLowerCase().includes(search.toLowerCase())
  )

  const getInitials = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-indigo-200 hover:text-white">
              ← Volver
            </Link>
            <h1 className="text-xl font-bold">Talmidim</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Search */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar talmid..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Stats */}
        <div className="bg-indigo-50 rounded-xl p-4 mb-4 text-center">
          <span className="text-2xl font-bold text-indigo-700">{talmidim.length}</span>
          <span className="text-indigo-600 ml-2">talmidim activos</span>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Cargando...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTalmidim.map((talmid) => (
              <Link
                key={talmid.id}
                href={`/talmidim/${talmid.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {talmid.fotoUrl ? (
                    <img
                      src={talmid.fotoUrl}
                      alt={`${talmid.nombre} ${talmid.apellido}`}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <Facehash name={`${talmid.nombre} ${talmid.apellido}`} size={56} />
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {talmid.apellido}, {talmid.nombre}
                    </h3>
                    <div className="flex gap-3 mt-1 text-sm text-gray-500">
                      {talmid.cantidadAsistencias > 0 && (
                        <span>{talmid.cantidadAsistencias} clases</span>
                      )}
                      {talmid.cantidadNotas > 0 && (
                        <span>{talmid.cantidadNotas} notas</span>
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

            {filteredTalmidim.length === 0 && search && (
              <div className="text-center text-gray-500 py-8">
                No se encontraron talmidim con &quot;{search}&quot;
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
