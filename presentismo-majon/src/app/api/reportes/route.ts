import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const talmidId = searchParams.get('talmidId')

  try {
    // Obtener todos los talmidim activos
    const talmidim = await prisma.talmid.findMany({
      where: { activo: true },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      include: {
        asistencias: {
          include: {
            clase: true,
          },
          orderBy: {
            clase: {
              fecha: 'desc',
            },
          },
        },
      },
    })

    // Obtener total de clases que no fueron canceladas
    const totalClases = await prisma.clase.count({
      where: { cancelada: false },
    })

    // Calcular estadisticas por talmid
    const reportes = talmidim.map((talmid) => {
      const asistencias = talmid.asistencias
      const presentes = asistencias.filter((a) => a.estado === 'presente').length
      const tardanzas = asistencias.filter((a) => a.estado === 'tardanza').length
      const ausentes = asistencias.filter((a) => a.estado === 'ausente').length
      const total = presentes + tardanzas + ausentes

      const porcentajeAsistencia = total > 0
        ? Math.round(((presentes + tardanzas) / total) * 100)
        : 0

      return {
        id: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        presentes,
        tardanzas,
        ausentes,
        totalClasesTomadas: total,
        porcentajeAsistencia,
        historial: talmidId === talmid.id
          ? asistencias.map((a) => ({
              fecha: a.clase.fecha.toISOString().split('T')[0],
              diaSemana: a.clase.diaSemana,
              estado: a.estado,
              justificacion: a.justificacion,
            }))
          : undefined,
      }
    })

    return NextResponse.json({
      totalClases,
      reportes,
    })
  } catch (error) {
    console.error('Error fetching reportes:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
