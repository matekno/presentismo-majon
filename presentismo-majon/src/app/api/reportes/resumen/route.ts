import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcularStatsClase } from '@/lib/asistencia'

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

    // Padrón de la kitá: quién debía estar en cada clase
    const talmidim = await prisma.talmid.findMany({
      where: { activo: true, kitaId: session.kitaId },
      select: {
        id: true,
        createdAt: true,
        ausenciasProgramadas: {
          where: { activa: true },
          select: { fechaInicio: true, fechaFin: true },
        },
      },
    })

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
        asistencias: { select: { talmidId: true, estado: true } },
      },
      orderBy: { fecha: 'asc' },
    })

    let sumAsistieron = 0
    let sumComputables = 0
    // Ponderado igual que el global: se acumulan asistencias y denominadores,
    // no promedios de promedios
    const porDia: Record<'martes' | 'viernes', { asistieron: number; computables: number; count: number }> = {
      martes: { asistieron: 0, computables: 0, count: 0 },
      viernes: { asistieron: 0, computables: 0, count: 0 },
    }

    const tendencia: { fecha: string; porcentaje: number }[] = []

    for (const clase of clases) {
      if (clase.asistencias.length === 0) continue // Solo clases con asistencia tomada

      const stats = calcularStatsClase({ clase, talmidim, asistencias: clase.asistencias })
      if (stats.totalComputables === 0) continue

      const asistieron = stats.presentes + stats.tardanzas
      sumAsistieron += asistieron
      sumComputables += stats.totalComputables

      tendencia.push({
        fecha: clase.fecha.toISOString().split('T')[0],
        porcentaje: stats.porcentaje,
      })

      if (clase.diaSemana === 'martes' || clase.diaSemana === 'viernes') {
        porDia[clase.diaSemana].asistieron += asistieron
        porDia[clase.diaSemana].computables += stats.totalComputables
        porDia[clase.diaSemana].count += 1
      }
    }

    const clasesConAsistencia = tendencia.length
    const porcentajeGlobal =
      sumComputables > 0 ? Math.round((sumAsistieron / sumComputables) * 100) : 0
    const promedioPorClase =
      clasesConAsistencia > 0 ? Math.round(sumAsistieron / clasesConAsistencia) : 0

    const resumenDia = (dia: 'martes' | 'viernes') => ({
      count: porDia[dia].count,
      porcentaje:
        porDia[dia].computables > 0
          ? Math.round((porDia[dia].asistieron / porDia[dia].computables) * 100)
          : null,
    })

    return NextResponse.json({
      porcentajeGlobal,
      clasesConAsistencia,
      promedioPorClase,
      // Solo los últimos MAX_TREND puntos para que el gráfico sea legible en mobile
      tendencia: tendencia.slice(-MAX_TREND),
      porDia: {
        martes: resumenDia('martes'),
        viernes: resumenDia('viernes'),
      },
    })
  } catch (error) {
    console.error('Error fetching resumen:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
