import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcularStatsClase } from '@/lib/asistencia'

export async function GET() {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Fin del día de hoy: solo clases pasadas o de hoy
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

    // Clases pasadas/de hoy, no canceladas, de la kitá
    const clases = await prisma.clase.findMany({
      where: {
        cancelada: false,
        fecha: { lte: finDeHoy },
        kitot: {
          some: { kitaId: session.kitaId },
        },
      },
      include: {
        docentes: { include: { docente: true } },
        asistencias: { select: { talmidId: true, estado: true } },
      },
      orderBy: { fecha: 'desc' },
    })

    const reportes = clases.map((clase) => {
      // Sin asistencia tomada no hay nada que medir: el porcentaje sería 0%
      // por un dato que falta cargar, no por inasistencia
      const stats =
        clase.asistencias.length > 0
          ? calcularStatsClase({ clase, talmidim, asistencias: clase.asistencias })
          : null
      // Idem si todos los del padrón tenían ausencia programada: no queda nadie
      // en el denominador y un 0% sería engañoso
      const medible = (stats?.totalComputables ?? 0) > 0

      return {
        id: clase.id,
        tipo: clase.tipo,
        fecha: clase.fecha.toISOString().split('T')[0],
        diaSemana: clase.diaSemana,
        titulo: clase.titulo,
        docentes: clase.docentes.map((cd) => ({
          nombre: cd.docente.nombre,
          apellido: cd.docente.apellido,
        })),
        presentes: stats?.presentes ?? 0,
        tardanzas: stats?.tardanzas ?? 0,
        ausentes: stats?.ausentes ?? 0,
        sinRegistro: stats?.sinRegistro ?? 0,
        justificadas: stats?.justificadas ?? 0,
        totalComputables: stats?.totalComputables ?? 0,
        porcentajeAsistencia: stats?.porcentaje ?? 0,
        tieneAsistencias: medible,
      }
    })

    return NextResponse.json({ totalTalmidim: talmidim.length, clases: reportes })
  } catch (error) {
    console.error('Error fetching reporte por clase:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
