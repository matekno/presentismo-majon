import { cookies } from 'next/headers'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE = 'soytalmid_session'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 días

export interface TalmidSession {
  talmidId: string
  nombre: string
  apellido: string
}

export async function createSession(talmidId: string, nombre: string, apellido: string): Promise<void> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  // Guardar en cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify({ token, talmidId, nombre, apellido }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  })

  // Actualizar lastLogin
  await prisma.talmid.update({
    where: { id: talmidId },
    data: { lastLogin: new Date() }
  })
}

export async function getSession(): Promise<TalmidSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE)

  if (!sessionCookie) return null

  try {
    const session = JSON.parse(sessionCookie.value) as TalmidSession & { token: string }
    return {
      talmidId: session.talmidId,
      nombre: session.nombre,
      apellido: session.apellido
    }
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function verifyPassword(email: string, password: string): Promise<{ valid: boolean; talmid?: { id: string; nombre: string; apellido: string } }> {
  const talmid = await prisma.talmid.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, nombre: true, apellido: true, passwordHash: true, activo: true }
  })

  if (!talmid || !talmid.passwordHash || !talmid.activo) {
    return { valid: false }
  }

  const valid = await bcrypt.compare(password, talmid.passwordHash)

  if (!valid) {
    return { valid: false }
  }

  return {
    valid: true,
    talmid: {
      id: talmid.id,
      nombre: talmid.nombre,
      apellido: talmid.apellido
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}
