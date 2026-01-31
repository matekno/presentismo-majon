import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

const SESSION_COOKIE = 'majon_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 dias

// Interfaz para la sesión con datos de kitá
export interface KitaSession {
  kitaId: string
  kitaNombre: string
  kitaDisplay: string
  kitaColor: string
  authenticated: boolean
}

export async function verifyPassword(kitaId: string, password: string): Promise<boolean> {
  const kita = await prisma.kita.findUnique({
    where: { id: kitaId, activa: true },
  })

  if (!kita) return false

  return bcrypt.compare(password, kita.passwordHash)
}

export async function createSession(kita: {
  id: string
  nombre: string
  nombreDisplay: string
  colorHex: string
}): Promise<void> {
  const cookieStore = await cookies()
  const expires = new Date(Date.now() + SESSION_DURATION)

  const sessionData: KitaSession = {
    kitaId: kita.id,
    kitaNombre: kita.nombre,
    kitaDisplay: kita.nombreDisplay,
    kitaColor: kita.colorHex,
    authenticated: true,
  }

  cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires,
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<KitaSession | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)

  if (!session) return null

  try {
    const data = JSON.parse(session.value) as KitaSession
    if (!data.authenticated || !data.kitaId) return null
    return data
  } catch {
    // Cookie antigua con formato 'authenticated' - migrar a nuevo formato
    if (session.value === 'authenticated') {
      return null // Forzar re-login para elegir kitá
    }
    return null
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null && session.authenticated
}
