import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { claseId, talmidId, estado, justificacion } = await request.json()

    if (!claseId || !talmidId || !estado) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (!['presente', 'ausente', 'tardanza'].includes(estado)) {
      return NextResponse.json(
        { error: 'Estado invalido' },
        { status: 400 }
      )
    }

    const asistencia = await prisma.asistencia.upsert({
      where: {
        talmidId_claseId: {
          talmidId,
          claseId,
        },
      },
      update: {
        estado,
        justificacion: justificacion || null,
      },
      create: {
        talmidId,
        claseId,
        estado,
        justificacion: justificacion || null,
      },
    })

    return NextResponse.json({ success: true, asistencia })
  } catch (error) {
    console.error('Error saving asistencia:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { claseId, talmidId } = await request.json()

    if (!claseId || !talmidId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    await prisma.asistencia.delete({
      where: {
        talmidId_claseId: {
          talmidId,
          claseId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting asistencia:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
