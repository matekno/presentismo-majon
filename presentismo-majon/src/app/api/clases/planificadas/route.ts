import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener clases planificadas (no canceladas) de la kitá, ordenadas por fecha desc
    const clases = await prisma.clase.findMany({
      where: {
        cancelada: false,
        kitot: {
          some: { kitaId: session.kitaId }
        }
      },
      include: {
        docentes: {
          include: {
            docente: true
          }
        },
        _count: {
          select: { asistencias: true },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 20, // Ultimas 20 clases
    })

    return NextResponse.json({
      clases: clases.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        fecha: c.fecha.toISOString().split('T')[0],
        diaSemana: c.diaSemana,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        titulo: c.titulo,
        docentes: c.docentes.map(cd => ({
          nombre: cd.docente.nombre,
          apellido: cd.docente.apellido,
          tipo: cd.docente.tipo
        })),
        tieneAsistencias: c._count.asistencias > 0,
        cantidadAsistencias: c._count.asistencias,
      })),
    })
  } catch (error) {
    console.error('Error fetching clases planificadas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
