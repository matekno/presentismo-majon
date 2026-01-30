import { NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const result = await verifyPassword(email, password)

    if (!result.valid || !result.talmid) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    await createSession(result.talmid.id, result.talmid.nombre, result.talmid.apellido)

    return NextResponse.json({
      success: true,
      talmid: {
        nombre: result.talmid.nombre,
        apellido: result.talmid.apellido
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
