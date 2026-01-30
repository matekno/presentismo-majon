import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET: Obtener detalle de clase para dar feedback
export async function GET(
  request: Request,
  { params }: { params: Promise<{ claseId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { claseId } = await params

    // Obtener clase con docentes
    const clase = await prisma.clase.findUnique({
      where: { id: claseId },
      include: {
        docentes: {
          include: {
            docente: {
              select: { id: true, nombre: true, apellido: true, tipo: true }
            }
          }
        }
      }
    })

    if (!clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Verificar que el talmid asistió
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

    // Verificar si ya dio feedback
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
        { error: 'Ya diste feedback de esta clase', alreadySubmitted: true },
        { status: 400 }
      )
    }

    return NextResponse.json({
      clase: {
        id: clase.id,
        fecha: clase.fecha.toISOString(),
        titulo: clase.titulo,
        diaSemana: clase.diaSemana,
        docentes: clase.docentes.map(cd => ({
          id: cd.docente.id,
          nombre: cd.docente.nombre,
          apellido: cd.docente.apellido,
          tipo: cd.docente.tipo
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching clase:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
