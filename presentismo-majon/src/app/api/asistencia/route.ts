import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

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

    // Verificar que la clase pertenezca a la kitá
    const clase = await prisma.clase.findFirst({
      where: {
        id: claseId,
        kitot: {
          some: { kitaId: session.kitaId }
        }
      }
    })

    if (!clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Verificar que el talmid pertenezca a la kitá
    const talmid = await prisma.talmid.findFirst({
      where: {
        id: talmidId,
        kitaId: session.kitaId
      }
    })

    if (!talmid) {
      return NextResponse.json({ error: 'Talmid no encontrado' }, { status: 404 })
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
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { claseId, talmidId } = await request.json()

    if (!claseId || !talmidId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la clase pertenezca a la kitá
    const clase = await prisma.clase.findFirst({
      where: {
        id: claseId,
        kitot: {
          some: { kitaId: session.kitaId }
        }
      }
    })

    if (!clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
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
