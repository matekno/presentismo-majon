import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const feriados = await prisma.feriado.findMany({
      orderBy: { fecha: 'asc' },
    })

    return NextResponse.json({
      feriados: feriados.map((f) => ({
        id: f.id,
        fecha: f.fecha.toISOString().split('T')[0],
        nombre: f.nombre,
        tipo: f.tipo,
      })),
    })
  } catch (error) {
    console.error('Error fetching feriados:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fecha, nombre, tipo } = await request.json()

    if (!fecha || !nombre) {
      return NextResponse.json(
        { error: 'Fecha y nombre son requeridos' },
        { status: 400 }
      )
    }

    const feriado = await prisma.feriado.create({
      data: {
        fecha: new Date(fecha),
        nombre,
        tipo: tipo || 'manual',
      },
    })

    return NextResponse.json({
      success: true,
      feriado: {
        id: feriado.id,
        fecha: feriado.fecha.toISOString().split('T')[0],
        nombre: feriado.nombre,
        tipo: feriado.tipo,
      },
    })
  } catch (error) {
    console.error('Error creating feriado:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.feriado.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feriado:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
