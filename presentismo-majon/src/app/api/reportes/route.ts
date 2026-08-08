import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcularStatsTalmid, detallarClasesTalmid, toDayKey } from '@/lib/asistencia'
import { getClasesComputables } from '@/lib/asistencia.server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const talmidId = searchParams.get('talmidId')

  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const [talmidim, clases] = await Promise.all([
      prisma.talmid.findMany({
        where: {
          activo: true,
          kitaId: session.kitaId,
        },
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: {
          asistencias: {
            select: { claseId: true, estado: true, justificacion: true },
          },
          ausenciasProgramadas: {
            where: { activa: true },
            select: { fechaInicio: true, fechaFin: true, justificacion: true },
          },
        },
      }),
      // Clases que le corresponden a la kitá: pasadas, no canceladas y con
      // asistencia tomada
      getClasesComputables(session.kitaId),
    ])

    // Calcular estadisticas por talmid
    const reportes = talmidim.map((talmid) => {
      const args = {
        clases,
        asistencias: talmid.asistencias,
        ausenciasProgramadas: talmid.ausenciasProgramadas,
        desde: talmid.createdAt,
      }
      const stats = calcularStatsTalmid(args)

      return {
        id: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        presentes: stats.presentes,
        tardanzas: stats.tardanzas,
        ausentes: stats.ausentes,
        sinRegistro: stats.sinRegistro,
        justificadas: stats.justificadas,
        totalComputables: stats.totalComputables,
        porcentajeAsistencia: stats.porcentaje,
        historial:
          talmidId === talmid.id
            ? detallarClasesTalmid(args).map((d) => ({
                fecha: toDayKey(d.fecha),
                diaSemana: d.diaSemana,
                tipo: d.tipo,
                justificacion: d.justificacion,
              }))
            : undefined,
      }
    })

    return NextResponse.json({
      totalClases: clases.length,
      reportes,
    })
  } catch (error) {
    console.error('Error fetching reportes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
