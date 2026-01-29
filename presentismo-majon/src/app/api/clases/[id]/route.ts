import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const clase = await prisma.clase.findUnique({
      where: { id },
      include: {
        docentes: {
          include: {
            docente: true
          }
        },
        asistencias: {
          include: {
            talmid: true,
          },
        },
      },
    })

    if (!clase) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Obtener todos los talmidim activos
    const talmidim = await prisma.talmid.findMany({
      where: { activo: true },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    })

    // Mapear asistencias existentes
    const asistenciasMap = new Map(
      clase.asistencias.map((a) => [a.talmidId, a])
    )

    // Crear lista completa con estado de asistencia
    const listaAsistencia = talmidim.map((talmid) => {
      const asistencia = asistenciasMap.get(talmid.id)
      return {
        talmidId: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        estado: asistencia?.estado || null,
        justificacion: asistencia?.justificacion || null,
      }
    })

    return NextResponse.json({
      clase: {
        id: clase.id,
        fecha: clase.fecha.toISOString().split('T')[0],
        diaSemana: clase.diaSemana,
        horaInicio: clase.horaInicio,
        horaFin: clase.horaFin,
        titulo: clase.titulo,
        docentes: clase.docentes.map(cd => ({
          nombre: cd.docente.nombre,
          apellido: cd.docente.apellido,
          tipo: cd.docente.tipo
        })),
        cancelada: clase.cancelada,
      },
      asistencias: listaAsistencia,
    })
  } catch (error) {
    console.error('Error fetching clase:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
