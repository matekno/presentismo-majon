import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { kitaId, password } = await request.json()

    if (!kitaId || !password) {
      return NextResponse.json(
        { error: 'Kitá y password requeridos' },
        { status: 400 }
      )
    }

    // Buscar la kitá
    const kita = await prisma.kita.findUnique({
      where: { id: kitaId, activa: true },
    })

    if (!kita) {
      return NextResponse.json(
        { error: 'Kitá no encontrada' },
        { status: 401 }
      )
    }

    // Verificar password
    const isValid = await verifyPassword(kitaId, password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Password incorrecto' },
        { status: 401 }
      )
    }

    // Crear sesión con datos de la kitá
    await createSession({
      id: kita.id,
      nombre: kita.nombre,
      nombreDisplay: kita.nombreDisplay,
      colorHex: kita.colorHex,
    })

    return NextResponse.json({
      success: true,
      kita: {
        id: kita.id,
        nombre: kita.nombre,
        nombreDisplay: kita.nombreDisplay,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
