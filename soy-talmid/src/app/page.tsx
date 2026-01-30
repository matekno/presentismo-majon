'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ClasePendiente {
  id: string
  fecha: string
  titulo: string | null
  docentes: { nombre: string; apellido: string }[]
}

export default function HomePage() {
  const [clasesPendientes, setClasesPendientes] = useState<ClasePendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [talmid, setTalmid] = useState<{ nombre: string; apellido: string } | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const t = useTranslations()

  useEffect(() => {
    fetchData()
    checkNotificationPermission()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/feedback')
      if (res.ok) {
        const data = await res.json()
        setClasesPendientes(data.clasesPendientes || [])
        setTalmid(data.talmid)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  function checkNotificationPermission() {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }

  async function handleEnableNotifications() {
    if (!('Notification' in window)) {
      alert(t('home.notifications.notSupported'))
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationsEnabled(true)
      // Suscribir al push
      try {
        const res = await fetch('/api/push/subscribe', { method: 'POST' })
        if (res.ok) {
          alert(t('home.notifications.enabled'))
        }
      } catch (error) {
        console.error('Error subscribing:', error)
      }
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{t('app.name')}</h1>
            {talmid && (
              <p className="text-emerald-100 text-sm">{t('home.greeting', { name: talmid.nombre })}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-emerald-100 hover:text-white text-sm"
          >
            {t('common.logout')}
          </button>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Banner de notificaciones */}
        {!notificationsEnabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 text-sm mb-2">
              {t('home.notifications.banner')}
            </p>
            <button
              onClick={handleEnableNotifications}
              className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
            >
              {t('home.notifications.enable')}
            </button>
          </div>
        )}

        {/* Clases pendientes de feedback */}
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t('home.pendingClasses.title')}
          </h2>

          {clasesPendientes.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-gray-600">{t('home.pendingClasses.empty')}</p>
              <Link href="/historial" className="text-emerald-600 text-sm mt-2 inline-block">
                {t('home.pendingClasses.viewHistory')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {clasesPendientes.map((clase) => (
                <Link
                  key={clase.id}
                  href={`/feedback/${clase.id}`}
                  className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        {clase.titulo || t('common.class')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(clase.fecha).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                      {clase.docentes.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {clase.docentes.map(d => `${d.nombre} ${d.apellido}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                      {t('home.pendingClasses.pending')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Link al historial */}
        <div className="mt-8 text-center">
          <Link
            href="/historial"
            className="text-emerald-600 font-medium hover:text-emerald-700"
          >
            {t('home.historyLink')}
          </Link>
        </div>
      </main>
    </div>
  )
}
