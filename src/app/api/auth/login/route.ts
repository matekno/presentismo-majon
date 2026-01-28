import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: 'Password requerido' },
        { status: 400 }
      )
    }

    const isValid = await verifyPassword(password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Password incorrecto' },
        { status: 401 }
      )
    }

    await createSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    )
  }
}
