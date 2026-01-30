import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: Obtener clases pendientes de feedback
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener clases donde el talmid estuvo presente y aún no dio feedback
    const clasesConAsistencia = await prisma.clase.findMany({
      where: {
        asistencias: {
          some: {
            talmidId: session.talmidId,
            estado: { in: ['presente', 'tardanza'] }
          }
        },
        feedbacks: {
          none: {
            talmidId: session.talmidId
          }
        },
        cancelada: false
      },
      include: {
        docentes: {
          include: {
            docente: {
              select: { nombre: true, apellido: true }
            }
          }
        }
      },
      orderBy: { fecha: 'desc' }
    })

    const clasesPendientes = clasesConAsistencia.map(clase => ({
      id: clase.id,
      fecha: clase.fecha.toISOString(),
      titulo: clase.titulo,
      docentes: clase.docentes.map(cd => ({
        nombre: cd.docente.nombre,
        apellido: cd.docente.apellido
      }))
    }))

    return NextResponse.json({
      clasesPendientes,
      talmid: {
        nombre: session.nombre,
        apellido: session.apellido
      }
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST: Enviar feedback
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { claseId, claseRating, claseComentario, docentesFeedback } = await request.json()

    if (!claseId || !claseRating || claseRating < 1 || claseRating > 5) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Verificar que el talmid asistió a la clase
    const asistencia = await prisma.asistencia.findFirst({
      where: {
        talmidId: session.talmidId,
        claseId,
        estado: { in: ['presente', 'tardanza'] }
      }
    })

    if (!asistencia) {
      return NextResponse.json(
        { error: 'No puedes dar feedback de una clase a la que no asististe' },
        { status: 403 }
      )
    }

    // Verificar que no haya dado feedback ya
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        talmidId_claseId: {
          talmidId: session.talmidId,
          claseId
        }
      }
    })

    if (existingFeedback) {
      return NextResponse.json(
        { error: 'Ya diste feedback de esta clase' },
        { status: 400 }
      )
    }

    // Crear feedback
    const feedback = await prisma.feedback.create({
      data: {
        talmidId: session.talmidId,
        claseId,
        claseRating,
        claseComentario: claseComentario || null,
        docentesFeedback: docentesFeedback ? JSON.stringify(docentesFeedback) : null
      }
    })

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id
    })
  } catch (error) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
