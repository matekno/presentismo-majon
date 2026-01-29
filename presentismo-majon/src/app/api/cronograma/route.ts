import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mes = searchParams.get('mes') // formato: "2025-03"
  const anio = searchParams.get('anio')

  try {
    let whereClause = {}

    if (mes) {
      const [year, month] = mes.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      whereClause = {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
      }
    } else if (anio) {
      const year = parseInt(anio)
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31, 23, 59, 59)
      whereClause = {
        fecha: {
          gte: startDate,
          lte: endDate,
        },
      }
    }

    const clases = await prisma.clase.findMany({
      where: whereClause,
      include: {
        docentes: {
          include: {
            docente: true
          }
        },
        _count: {
          select: { asistencias: true },
        },
      },
      orderBy: { fecha: 'asc' },
    })

    // Obtener feriados del mismo periodo
    const feriados = await prisma.feriado.findMany({
      where: whereClause,
      orderBy: { fecha: 'asc' },
    })

    return NextResponse.json({
      clases: clases.map((c) => ({
        id: c.id,
        fecha: c.fecha.toISOString().split('T')[0],
        diaSemana: c.diaSemana,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        titulo: c.titulo,
        // Nueva estructura: array de docentes
        docentes: c.docentes.map(cd => ({
          id: cd.docente.id,
          nombre: cd.docente.nombre,
          apellido: cd.docente.apellido,
          tipo: cd.docente.tipo
        })),
        cancelada: c.cancelada,
        motivo: c.motivo,
        tieneAsistencias: c._count.asistencias > 0,
      })),
      feriados: feriados.map((f) => ({
        id: f.id,
        fecha: f.fecha.toISOString().split('T')[0],
        nombre: f.nombre,
        tipo: f.tipo,
      })),
    })
  } catch (error) {
    console.error('Error fetching cronograma:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fecha, titulo, docenteIds, horaInicio, horaFin } = await request.json()

    if (!fecha) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

    // Parsear fecha correctamente (formato YYYY-MM-DD)
    const [year, month, day] = fecha.split('-').map(Number)
    const fechaDate = new Date(year, month - 1, day)
    const dayOfWeek = fechaDate.getDay()

    // Validar que sea martes (2) o viernes (5)
    if (dayOfWeek !== 2 && dayOfWeek !== 5) {
      return NextResponse.json(
        { error: `Solo se pueden crear clases los martes o viernes (dia recibido: ${dayOfWeek}, fecha: ${fecha})` },
        { status: 400 }
      )
    }

    const diaSemana = dayOfWeek === 2 ? 'martes' : 'viernes'
    const defaultHoraInicio = dayOfWeek === 2 ? '18:30' : '17:30'
    const defaultHoraFin = dayOfWeek === 2 ? '20:30' : '21:00'

    // Normalizar docenteIds a array
    const docenteIdsArray: string[] = Array.isArray(docenteIds) ? docenteIds : (docenteIds ? [docenteIds] : [])

    // Verificar si ya existe una clase en esa fecha
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59)

    const existingClase = await prisma.clase.findFirst({
      where: {
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    if (existingClase) {
      // Actualizar clase existente
      const clase = await prisma.clase.update({
        where: { id: existingClase.id },
        data: {
          titulo: titulo || null,
          horaInicio: horaInicio || defaultHoraInicio,
          horaFin: horaFin || defaultHoraFin,
        },
      })

      // Actualizar relaciones de docentes
      // 1. Eliminar docentes anteriores
      await prisma.claseDocente.deleteMany({
        where: { claseId: existingClase.id }
      })

      // 2. Crear nuevas relaciones
      if (docenteIdsArray.length > 0) {
        await prisma.claseDocente.createMany({
          data: docenteIdsArray.map(docenteId => ({
            claseId: existingClase.id,
            docenteId
          }))
        })
      }

      // Obtener clase actualizada con docentes
      const claseConDocentes = await prisma.clase.findUnique({
        where: { id: clase.id },
        include: {
          docentes: {
            include: { docente: true }
          }
        }
      })

      return NextResponse.json({ success: true, clase: claseConDocentes, updated: true })
    }

    // Crear nueva clase
    const clase = await prisma.clase.create({
      data: {
        fecha: fechaDate,
        diaSemana,
        horaInicio: horaInicio || defaultHoraInicio,
        horaFin: horaFin || defaultHoraFin,
        titulo: titulo || null,
        docentes: docenteIdsArray.length > 0 ? {
          create: docenteIdsArray.map(docenteId => ({
            docenteId
          }))
        } : undefined
      },
      include: {
        docentes: {
          include: { docente: true }
        }
      },
    })

    return NextResponse.json({ success: true, clase, updated: false })
  } catch (error) {
    console.error('Error creating/updating clase:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verificar si tiene asistencias
    const clase = await prisma.clase.findUnique({
      where: { id },
      include: { _count: { select: { asistencias: true } } },
    })

    if (clase && clase._count.asistencias > 0) {
      // Si tiene asistencias, marcar como cancelada en lugar de eliminar
      await prisma.clase.update({
        where: { id },
        data: { cancelada: true },
      })
      return NextResponse.json({ success: true, cancelled: true })
    }

    // Si no tiene asistencias, eliminar
    await prisma.clase.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, deleted: true })
  } catch (error) {
    console.error('Error deleting clase:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
