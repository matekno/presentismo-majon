import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDiaSemana, getHorarioClase, fromLocalDateString, toLocalDateString } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fechaStr = searchParams.get('fecha')

  if (!fechaStr) {
    return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
  }

  try {
    const fecha = fromLocalDateString(fechaStr)
    const diaSemana = getDiaSemana(fecha)

    if (!diaSemana) {
      return NextResponse.json({ error: 'No es dia de clase' }, { status: 400 })
    }

    // Verificar si es feriado
    const startOfDay = new Date(fecha)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(fecha)
    endOfDay.setHours(23, 59, 59, 999)

    const feriado = await prisma.feriado.findFirst({
      where: {
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    if (feriado) {
      return NextResponse.json({
        esFeriado: true,
        feriado: {
          nombre: feriado.nombre,
          tipo: feriado.tipo,
        },
      })
    }

    // Buscar o crear clase
    let clase = await prisma.clase.findFirst({
      where: {
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
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

    const horario = getHorarioClase(fecha)

    if (!clase) {
      clase = await prisma.clase.create({
        data: {
          fecha: startOfDay,
          diaSemana,
          horaInicio: horario.inicio,
          horaFin: horario.fin,
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
      esFeriado: false,
      clase: {
        id: clase.id,
        fecha: toLocalDateString(clase.fecha),
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
        motivo: clase.motivo,
      },
      asistencias: listaAsistencia,
    })
  } catch (error) {
    console.error('Error fetching clase:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
