import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    })

    return NextResponse.json({ docentes })
  } catch (error) {
    console.error('Error fetching docentes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, apellido } = await request.json()

    if (!nombre || !apellido) {
      return NextResponse.json(
        { error: 'Nombre y apellido son requeridos' },
        { status: 400 }
      )
    }

    const docente = await prisma.docente.create({
      data: { nombre, apellido },
    })

    return NextResponse.json({ success: true, docente })
  } catch (error) {
    console.error('Error creating docente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.docente.update({
      where: { id },
      data: { activo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting docente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
