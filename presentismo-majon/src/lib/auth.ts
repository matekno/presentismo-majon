import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

const SESSION_COOKIE = 'majon_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 dias

export async function verifyPassword(password: string): Promise<boolean> {
  const config = await prisma.config.findUnique({
    where: { clave: 'password_hash' },
  })

  if (!config) return false

  return bcrypt.compare(password, config.valor)
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies()
  const expires = new Date(Date.now() + SESSION_DURATION)

  cookieStore.set(SESSION_COOKIE, 'authenticated', {
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

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value === 'authenticated'
}
