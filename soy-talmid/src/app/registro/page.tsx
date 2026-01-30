'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegistroPage() {
  const [step, setStep] = useState<'codigo' | 'datos'>('codigo')
  const [codigoInvitacion, setCodigoInvitacion] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-code', code: codigoInvitacion })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Código inválido')
        return
      }

      setStep('datos')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          code: codigoInvitacion,
          email,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrar')
        return
      }

      // Redirigir al login con mensaje de éxito
      window.location.href = '/login?registered=true'
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-500 to-emerald-700 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Link href="/login" className="text-white/80 hover:text-white flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
      </div>

      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 mb-4">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Crear cuenta</h1>
        <p className="text-emerald-100 text-sm">
          {step === 'codigo' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
        </p>
      </div>

      {/* Form area */}
      <div className="bg-white rounded-t-3xl p-8 shadow-2xl">
        {step === 'codigo' ? (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              Código de invitación
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Pedile el código a tu mejanej
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={codigoInvitacion}
                  onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-center text-2xl tracking-widest font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="CODIGO"
                  maxLength={20}
                  required
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !codigoInvitacion}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Verificando...' : 'Verificar código'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-2 text-center">
              Tus datos
            </h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Usá el email con el que estás registrado en el Majon
            </p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Repetí tu contraseña"
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>

            <button
              onClick={() => setStep('codigo')}
              className="w-full mt-4 text-gray-500 text-sm hover:text-gray-700"
            >
              ← Cambiar código
            </button>
          </>
        )}
      </div>
    </div>
  )
}
