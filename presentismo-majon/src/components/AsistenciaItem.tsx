'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Estado = 'presente' | 'ausente' | 'tardanza' | null

interface AsistenciaItemProps {
  talmidId: string
  nombre: string
  apellido: string
  estadoInicial: Estado
  justificacionInicial: string | null
  claseId: string
  onEstadoChange: (talmidId: string, estado: Estado, justificacion: string | null) => void
  tieneAusenciaProgramada?: boolean
  ausenciaProgramadaJustificacion?: string | null
}

export default function AsistenciaItem({
  talmidId,
  nombre,
  apellido,
  estadoInicial,
  justificacionInicial,
  claseId,
  onEstadoChange,
  tieneAusenciaProgramada = false,
  ausenciaProgramadaJustificacion = null,
}: AsistenciaItemProps) {
  const [estado, setEstado] = useState<Estado>(estadoInicial)
  const [justificacion, setJustificacion] = useState(justificacionInicial || ausenciaProgramadaJustificacion || '')
  const [showJustificacion, setShowJustificacion] = useState(false)
  const [pendingEstado, setPendingEstado] = useState<Estado>(null)
  const [saving, setSaving] = useState(false)
  const t = useTranslations('asistenciaItem')

  // Determinar si debe mostrarse como pre-seleccionado ausente
  const ausenciaPendiente = tieneAusenciaProgramada && !estadoInicial

  const guardarAsistencia = async (nuevoEstado: Estado, justif: string | null = null) => {
    if (!nuevoEstado) return

    setSaving(true)
    try {
      const res = await fetch('/api/asistencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claseId,
          talmidId,
          estado: nuevoEstado,
          justificacion: justif,
        }),
      })

      if (res.ok) {
        setEstado(nuevoEstado)
        setJustificacion(justif || '')
        onEstadoChange(talmidId, nuevoEstado, justif)
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setSaving(false)
      setPendingEstado(null)
    }
  }

  const handleEstadoClick = (nuevoEstado: Estado) => {
    if (saving) return

    // Si es ausente, pedir justificacion primero
    if (nuevoEstado === 'ausente') {
      setPendingEstado('ausente')
      setShowJustificacion(true)
      return
    }

    // Para presente y tardanza, guardar directamente (sin justificacion)
    guardarAsistencia(nuevoEstado, null)
    setShowJustificacion(false)
    setJustificacion('')
  }

  const handleGuardarAusencia = () => {
    if (!justificacion.trim()) {
      return // No permitir guardar sin justificacion
    }
    guardarAsistencia('ausente', justificacion.trim())
    setShowJustificacion(false)
    setPendingEstado(null)
  }

  const handleCancelarAusencia = () => {
    setShowJustificacion(false)
    setPendingEstado(null)
    setJustificacion(justificacionInicial || '')
  }

  const getButtonClass = (btnEstado: Estado) => {
    const base = 'flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all active:scale-95'
    const selected = estado === btnEstado
    const pending = pendingEstado === btnEstado
    // Mostrar ausente pre-seleccionado visualmente si hay ausencia programada pendiente
    const preseleccionado = btnEstado === 'ausente' && ausenciaPendiente

    if (btnEstado === 'presente') {
      return `${base} ${selected ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`
    }
    if (btnEstado === 'tardanza') {
      return `${base} ${selected ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`
    }
    if (btnEstado === 'ausente') {
      return `${base} ${selected || pending || preseleccionado ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`
    }
    return base
  }

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-opacity ${saving ? 'opacity-60' : ''} ${ausenciaPendiente ? 'border-orange-300 bg-orange-50' : ''}`}>
      {/* Badge de ausencia programada */}
      {tieneAusenciaProgramada && (
        <div className="flex items-center gap-1 mb-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full w-fit">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Vacaciones
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-semibold text-gray-800">{apellido}</span>
          <span className="text-gray-600">, {nombre}</span>
        </div>
        {estado && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            estado === 'presente' ? 'bg-green-100 text-green-700' :
            estado === 'tardanza' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {estado === 'presente' ? '✓' : estado === 'tardanza' ? '⏰' : '✗'}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleEstadoClick('presente')}
          disabled={saving}
          className={getButtonClass('presente')}
        >
          {t('present')}
        </button>
        <button
          onClick={() => handleEstadoClick('tardanza')}
          disabled={saving}
          className={getButtonClass('tardanza')}
        >
          {t('late')}
        </button>
        <button
          onClick={() => handleEstadoClick('ausente')}
          disabled={saving}
          className={getButtonClass('ausente')}
        >
          {t('absent')}
        </button>
      </div>

      {/* Form de justificacion para ausentes */}
      {showJustificacion && (
        <div className="mt-3 space-y-2 bg-red-50 p-3 rounded-lg border border-red-200">
          <label className="block text-sm font-medium text-red-800">
            {t('justification.label')}
          </label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder={t('justification.placeholder')}
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleGuardarAusencia}
              disabled={saving || !justificacion.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('justification.confirming') : t('justification.confirm')}
            </button>
            <button
              onClick={handleCancelarAusencia}
              disabled={saving}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg"
            >
              {t('justification.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Mostrar justificacion existente */}
      {estado === 'ausente' && justificacion && !showJustificacion && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <span className="font-medium">{t('justification.reason')}</span> {justificacion}
        </div>
      )}

      {/* Mensaje de ausencia programada pendiente */}
      {ausenciaPendiente && !showJustificacion && (
        <div className="mt-2 text-sm text-orange-700 bg-orange-100 px-3 py-2 rounded-lg">
          <span className="font-medium">Ausencia programada:</span> {ausenciaProgramadaJustificacion}
          <div className="text-xs text-orange-600 mt-1">
            Click en &quot;Ausente&quot; para confirmar, o en otro estado si asistio
          </div>
        </div>
      )}
    </div>
  )
}
