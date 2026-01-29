import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { categoria, contenido } = await request.json()

    if (!categoria || !contenido) {
      return NextResponse.json(
        { error: 'Categoria y contenido son requeridos' },
        { status: 400 }
      )
    }

    if (!['academico', 'conducta', 'salud', 'general'].includes(categoria)) {
      return NextResponse.json(
        { error: 'Categoria invalida' },
        { status: 400 }
      )
    }

    const nota = await prisma.nota.create({
      data: {
        talmidId: id,
        categoria,
        contenido,
      },
    })

    return NextResponse.json({
      success: true,
      nota: {
        id: nota.id,
        categoria: nota.categoria,
        contenido: nota.contenido,
        createdAt: nota.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating nota:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params // talmidId no se usa, pero necesitamos await

  try {
    const { notaId } = await request.json()

    if (!notaId) {
      return NextResponse.json({ error: 'ID de nota requerido' }, { status: 400 })
    }

    await prisma.nota.delete({
      where: { id: notaId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting nota:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
