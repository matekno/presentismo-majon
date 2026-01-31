import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const ausencias = await prisma.ausenciaProgramada.findMany({
      where: { talmidId: id },
      orderBy: [{ activa: 'desc' }, { fechaInicio: 'desc' }],
    })

    return NextResponse.json({
      ausencias: ausencias.map((a) => ({
        id: a.id,
        fechaInicio: a.fechaInicio.toISOString().split('T')[0],
        fechaFin: a.fechaFin.toISOString().split('T')[0],
        justificacion: a.justificacion,
        activa: a.activa,
        createdAt: a.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching ausencias:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { fechaInicio, fechaFin, justificacion } = await request.json()

    if (!fechaInicio || !fechaFin || !justificacion?.trim()) {
      return NextResponse.json(
        { error: 'Fecha inicio, fecha fin y justificacion son requeridos' },
        { status: 400 }
      )
    }

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)

    if (fin < inicio) {
      return NextResponse.json(
        { error: 'La fecha fin debe ser igual o posterior a la fecha inicio' },
        { status: 400 }
      )
    }

    // Verificar solapamiento con ausencias activas existentes
    const solapamiento = await prisma.ausenciaProgramada.findFirst({
      where: {
        talmidId: id,
        activa: true,
        OR: [
          {
            // Nueva ausencia empieza durante una existente
            fechaInicio: { lte: inicio },
            fechaFin: { gte: inicio },
          },
          {
            // Nueva ausencia termina durante una existente
            fechaInicio: { lte: fin },
            fechaFin: { gte: fin },
          },
          {
            // Nueva ausencia contiene completamente una existente
            fechaInicio: { gte: inicio },
            fechaFin: { lte: fin },
          },
        ],
      },
    })

    if (solapamiento) {
      return NextResponse.json(
        { error: 'Ya existe una ausencia programada que se solapa con estas fechas' },
        { status: 400 }
      )
    }

    const ausencia = await prisma.ausenciaProgramada.create({
      data: {
        talmidId: id,
        fechaInicio: inicio,
        fechaFin: fin,
        justificacion: justificacion.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      ausencia: {
        id: ausencia.id,
        fechaInicio: ausencia.fechaInicio.toISOString().split('T')[0],
        fechaFin: ausencia.fechaFin.toISOString().split('T')[0],
        justificacion: ausencia.justificacion,
        activa: ausencia.activa,
        createdAt: ausencia.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating ausencia:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params

  try {
    const { ausenciaId } = await request.json()

    if (!ausenciaId) {
      return NextResponse.json({ error: 'ID de ausencia requerido' }, { status: 400 })
    }

    await prisma.ausenciaProgramada.delete({
      where: { id: ausenciaId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ausencia:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
