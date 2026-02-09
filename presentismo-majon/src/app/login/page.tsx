'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface Kita {
  id: string
  nombre: string
  nombreDisplay: string
  anio: number
  colorHex: string
}

export default function LoginPage() {
  const [kitot, setKitot] = useState<Kita[]>([])
  const [selectedKita, setSelectedKita] = useState<string>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingKitot, setLoadingKitot] = useState(true)
  const router = useRouter()
  const t = useTranslations('login')

  // Cargar kitot al montar
  useEffect(() => {
    fetch('/api/kitot')
      .then(res => res.json())
      .then(data => {
        setKitot(data.kitot || [])
        setLoadingKitot(false)
      })
      .catch(() => {
        setLoadingKitot(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedKita) {
      setError(t('error.selectKita'))
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitaId: selectedKita, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('error.invalid'))
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError(t('error.connection'))
    } finally {
      setLoading(false)
    }
  }

  const selectedKitaData = kitot.find(k => k.id === selectedKita)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
            <p className="text-gray-500 mt-2">{t('subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de Kitá */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('selectKita')}
              </label>
              {loadingKitot ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {kitot.map((kita) => (
                    <button
                      key={kita.id}
                      type="button"
                      onClick={() => setSelectedKita(kita.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedKita === kita.id
                          ? 'border-current bg-opacity-10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: selectedKita === kita.id ? kita.colorHex : undefined,
                        backgroundColor: selectedKita === kita.id ? `${kita.colorHex}15` : undefined,
                      }}
                    >
                      <span
                        className="font-semibold text-sm"
                        style={{ color: selectedKita === kita.id ? kita.colorHex : '#374151' }}
                      >
                        {kita.nombreDisplay}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        {kita.anio}° año
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campo de Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none transition text-gray-900"
                style={{
                  '--tw-ring-color': selectedKitaData?.colorHex || '#3B82F6',
                } as React.CSSProperties}
                placeholder={t('passwordPlaceholder')}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedKita}
              className="w-full text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: selectedKitaData?.colorHex || '#3B82F6',
              }}
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
