import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/kitot']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir rutas publicas
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Permitir archivos estaticos y manifest
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/icon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  // Verificar sesion
  const session = request.cookies.get('majon_session')

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar que la sesión sea válida (puede ser JSON o el viejo formato 'authenticated')
  try {
    const sessionData = JSON.parse(session.value)
    if (!sessionData.authenticated || !sessionData.kitaId) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // Si no es JSON válido, verificar formato antiguo
    if (session.value !== 'authenticated') {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    // Si es 'authenticated' (formato viejo), redirigir a login para elegir kitá
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
