'use client'

import { useState, useEffect } from 'react'

interface KitaInfo {
  id: string
  nombre: string
  nombreDisplay: string
  colorHex: string
}

export function KitaBadge() {
  const [kita, setKita] = useState<KitaInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.kita) {
          setKita(data.kita)
        }
      })
      .catch(() => {
        // Silenciar error
      })
  }, [])

  if (!kita) return null

  return (
    <span
      className="px-3 py-1 rounded-full text-white text-sm font-medium shadow-sm"
      style={{ backgroundColor: kita.colorHex }}
    >
      {kita.nombreDisplay}
    </span>
  )
}
