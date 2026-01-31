import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// GET /api/auth/session - Obtener datos de la sesión actual
export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      kita: {
        id: session.kitaId,
        nombre: session.kitaNombre,
        nombreDisplay: session.kitaDisplay,
        colorHex: session.kitaColor,
      },
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
