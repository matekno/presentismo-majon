import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toDayKey } from '@/lib/asistencia'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que la clase pertenezca a la kitá
    const clase = await prisma.clase.findFirst({
      where: {
        id,
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

    // Obtener todos los talmidim activos de la kitá
    const talmidim = await prisma.talmid.findMany({
      where: {
        activo: true,
        kitaId: session.kitaId
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    })

    // Mapear asistencias existentes
    const asistenciasMap = new Map(
      clase.asistencias.map((a) => [a.talmidId, a])
    )

    // Obtener ausencias programadas activas que incluyan la fecha de esta clase.
    // Se compara contra el día completo: las clases se guardan a medianoche
    // local y las ausencias a medianoche UTC, así que comparar los Date crudos
    // dejaba afuera a las ausencias de un solo día.
    const claseKey = toDayKey(clase.fecha)
    const ausenciasProgramadas = await prisma.ausenciaProgramada.findMany({
      where: {
        activa: true,
        fechaInicio: { lte: new Date(`${claseKey}T23:59:59.999Z`) },
        fechaFin: { gte: new Date(`${claseKey}T00:00:00.000Z`) },
      },
    })

    // Mapear ausencias por talmidId
    const ausenciasMap = new Map(
      ausenciasProgramadas.map((a) => [a.talmidId, a])
    )

    // Crear lista completa con estado de asistencia y ausencias programadas
    const listaAsistencia = talmidim.map((talmid) => {
      const asistencia = asistenciasMap.get(talmid.id)
      const ausenciaProgramada = ausenciasMap.get(talmid.id)
      return {
        talmidId: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        estado: asistencia?.estado || null,
        justificacion: asistencia?.justificacion || null,
        tieneAusenciaProgramada: !!ausenciaProgramada,
        ausenciaProgramadaJustificacion: ausenciaProgramada?.justificacion || null,
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
