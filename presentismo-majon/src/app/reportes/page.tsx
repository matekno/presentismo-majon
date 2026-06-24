'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface ReporteCard {
  href: string
  key: 'talmidim' | 'clases' | 'resumen' | 'alertas' | 'tardanzas'
  iconBg: string
  iconColor: string
  icon: React.ReactNode
}

const cards: ReporteCard[] = [
  {
    href: '/reportes/talmidim',
    key: 'talmidim',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
  },
  {
    href: '/reportes/clases',
    key: 'clases',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    href: '/reportes/resumen',
    key: 'resumen',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    href: '/reportes/alertas',
    key: 'alertas',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z"
      />
    ),
  },
  {
    href: '/reportes/tardanzas',
    key: 'tardanzas',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
]

export default function ReportesPage() {
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-200 hover:text-white">
              {t('common.back')}
            </Link>
            <h1 className="text-xl font-bold">{t('reportes.title')}</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-gray-500 mb-4">{t('reportes.subtitle')}</p>

        <div className="space-y-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <svg
                    className={`w-7 h-7 ${card.iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {card.icon}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800">
                    {t(`reportes.cards.${card.key}.title`)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t(`reportes.cards.${card.key}.description`)}
                  </p>
                </div>
                <svg
                  className="w-6 h-6 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
