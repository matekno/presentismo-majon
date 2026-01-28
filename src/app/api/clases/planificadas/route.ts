import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Obtener clases planificadas (no canceladas) ordenadas por fecha desc
    const clases = await prisma.clase.findMany({
      where: {
        cancelada: false,
      },
      include: {
        docente: true,
        _count: {
          select: { asistencias: true },
        },
      },
      orderBy: { fecha: 'desc' },
      take: 20, // Ultimas 20 clases
    })

    // Verificar cuales tienen feriado
    const fechas = clases.map(c => {
      const startOfDay = new Date(c.fecha)
      startOfDay.setHours(0, 0, 0, 0)
      return startOfDay
    })

    const feriados = await prisma.feriado.findMany({
      where: {
        fecha: {
          in: fechas,
        },
      },
    })

    const feriadosFechas = new Set(
      feriados.map(f => f.fecha.toISOString().split('T')[0])
    )

    // Filtrar clases que no caen en feriado
    const clasesValidas = clases.filter(c => {
      const fechaStr = c.fecha.toISOString().split('T')[0]
      return !feriadosFechas.has(fechaStr)
    })

    return NextResponse.json({
      clases: clasesValidas.map((c) => ({
        id: c.id,
        fecha: c.fecha.toISOString().split('T')[0],
        diaSemana: c.diaSemana,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        titulo: c.titulo,
        docente: c.docente
          ? { nombre: c.docente.nombre, apellido: c.docente.apellido }
          : null,
        tieneAsistencias: c._count.asistencias > 0,
        cantidadAsistencias: c._count.asistencias,
      })),
    })
  } catch (error) {
    console.error('Error fetching clases planificadas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
