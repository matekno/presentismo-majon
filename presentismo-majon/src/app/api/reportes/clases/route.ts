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

    // Fin del día de hoy: solo clases pasadas o de hoy
    const finDeHoy = new Date()
    finDeHoy.setHours(23, 59, 59, 999)

    // Total de talmidim activos de la kitá (para contexto "X de Y")
    const totalTalmidim = await prisma.talmid.count({
      where: { activo: true, kitaId: session.kitaId },
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
        asistencias: { select: { estado: true } },
      },
      orderBy: { fecha: 'desc' },
    })

    const reportes = clases.map((clase) => {
      const presentes = clase.asistencias.filter((a) => a.estado === 'presente').length
      const tardanzas = clase.asistencias.filter((a) => a.estado === 'tardanza').length
      const ausentes = clase.asistencias.filter((a) => a.estado === 'ausente').length
      const totalRegistros = presentes + tardanzas + ausentes
      const porcentajeAsistencia =
        totalRegistros > 0
          ? Math.round(((presentes + tardanzas) / totalRegistros) * 100)
          : 0

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
        presentes,
        tardanzas,
        ausentes,
        totalRegistros,
        porcentajeAsistencia,
        tieneAsistencias: totalRegistros > 0,
      }
    })

    return NextResponse.json({ totalTalmidim, clases: reportes })
  } catch (error) {
    console.error('Error fetching reporte por clase:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
