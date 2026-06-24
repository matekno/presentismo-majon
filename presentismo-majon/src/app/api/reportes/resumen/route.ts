import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const MAX_TREND = 30 // Cantidad máxima de puntos en el gráfico de tendencia

export async function GET() {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const finDeHoy = new Date()
    finDeHoy.setHours(23, 59, 59, 999)

    // Clases pasadas/de hoy, no canceladas, de la kitá (asc por fecha)
    const clases = await prisma.clase.findMany({
      where: {
        cancelada: false,
        fecha: { lte: finDeHoy },
        kitot: {
          some: { kitaId: session.kitaId },
        },
      },
      include: {
        asistencias: { select: { estado: true } },
      },
      orderBy: { fecha: 'asc' },
    })

    let sumAsistieron = 0
    let sumRegistros = 0
    const porDia: Record<'martes' | 'viernes', { sumPct: number; count: number }> = {
      martes: { sumPct: 0, count: 0 },
      viernes: { sumPct: 0, count: 0 },
    }

    const tendencia: { fecha: string; porcentaje: number }[] = []

    for (const clase of clases) {
      const presentes = clase.asistencias.filter((a) => a.estado === 'presente').length
      const tardanzas = clase.asistencias.filter((a) => a.estado === 'tardanza').length
      const ausentes = clase.asistencias.filter((a) => a.estado === 'ausente').length
      const registros = presentes + tardanzas + ausentes
      if (registros === 0) continue // Solo clases con asistencia tomada

      const asistieron = presentes + tardanzas
      const porcentaje = Math.round((asistieron / registros) * 100)

      sumAsistieron += asistieron
      sumRegistros += registros

      tendencia.push({
        fecha: clase.fecha.toISOString().split('T')[0],
        porcentaje,
      })

      if (clase.diaSemana === 'martes' || clase.diaSemana === 'viernes') {
        porDia[clase.diaSemana].sumPct += porcentaje
        porDia[clase.diaSemana].count += 1
      }
    }

    const clasesConAsistencia = tendencia.length
    const porcentajeGlobal =
      sumRegistros > 0 ? Math.round((sumAsistieron / sumRegistros) * 100) : 0
    const promedioPorClase =
      clasesConAsistencia > 0 ? Math.round(sumAsistieron / clasesConAsistencia) : 0

    return NextResponse.json({
      porcentajeGlobal,
      clasesConAsistencia,
      promedioPorClase,
      // Solo los últimos MAX_TREND puntos para que el gráfico sea legible en mobile
      tendencia: tendencia.slice(-MAX_TREND),
      porDia: {
        martes: {
          count: porDia.martes.count,
          porcentaje:
            porDia.martes.count > 0
              ? Math.round(porDia.martes.sumPct / porDia.martes.count)
              : null,
        },
        viernes: {
          count: porDia.viernes.count,
          porcentaje:
            porDia.viernes.count > 0
              ? Math.round(porDia.viernes.sumPct / porDia.viernes.count)
              : null,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching resumen:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
