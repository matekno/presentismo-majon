import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

const claseInclude = {
  docentes: {
    include: {
      docente: true,
    },
  },
  _count: {
    select: { asistencias: true },
  },
} satisfies Prisma.ClaseInclude

type ClaseConDatos = Prisma.ClaseGetPayload<{ include: typeof claseInclude }>

const VENTANA = 20 // Cantidad de clases más cercanas a hoy que se devuelven

export async function GET() {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Inicio del día de hoy (para separar pasadas de futuras)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const baseWhere: Prisma.ClaseWhereInput = {
      cancelada: false,
      kitot: {
        some: { kitaId: session.kitaId },
      },
    }

    // Traer una ventana centrada en hoy: las próximas (incluye hoy) y las
    // pasadas más recientes. Luego nos quedamos con las VENTANA más cercanas.
    const [futuras, pasadas] = await Promise.all([
      prisma.clase.findMany({
        where: { ...baseWhere, fecha: { gte: hoy } },
        include: claseInclude,
        orderBy: { fecha: 'asc' },
        take: VENTANA,
      }),
      prisma.clase.findMany({
        where: { ...baseWhere, fecha: { lt: hoy } },
        include: claseInclude,
        orderBy: { fecha: 'desc' },
        take: VENTANA,
      }),
    ])

    // Combinar y quedarnos con las VENTANA clases más cercanas a hoy,
    // ordenadas por fecha descendente (más reciente/futura primero).
    const clases = [...futuras, ...pasadas]
      .sort(
        (a, b) =>
          Math.abs(a.fecha.getTime() - hoy.getTime()) -
          Math.abs(b.fecha.getTime() - hoy.getTime())
      )
      .slice(0, VENTANA)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())

    return NextResponse.json({
      clases: clases.map((c: ClaseConDatos) => ({
        id: c.id,
        tipo: c.tipo,
        fecha: c.fecha.toISOString().split('T')[0],
        diaSemana: c.diaSemana,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        titulo: c.titulo,
        docentes: c.docentes.map((cd) => ({
          nombre: cd.docente.nombre,
          apellido: cd.docente.apellido,
          tipo: cd.docente.tipo,
        })),
        tieneAsistencias: c._count.asistencias > 0,
        cantidadAsistencias: c._count.asistencias,
      })),
    })
  } catch (error) {
    console.error('Error fetching clases planificadas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
