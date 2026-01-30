import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/registro', '/api/auth/login', '/api/auth/registro']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Archivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/cron') ||
    pathname.includes('.') // archivos con extensión
  ) {
    return NextResponse.next()
  }

  // Verificar sesión
  const session = request.cookies.get('soytalmid_session')

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
