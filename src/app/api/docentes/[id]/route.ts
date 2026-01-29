import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const docente = await prisma.docente.findUnique({
      where: { id },
      include: {
        clases: {
          include: {
            clase: {
              include: {
                _count: {
                  select: { asistencias: true }
                }
              }
            }
          },
          orderBy: {
            clase: { fecha: 'desc' }
          }
        }
      }
    })

    if (!docente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
    }

    // Obtener total de clases del periodo para calcular porcentaje
    const totalClasesPeriodo = await prisma.clase.count({
      where: { cancelada: false }
    })

    // Calcular estadisticas
    const clasesDelDocente = docente.clases.filter(cd => !cd.clase.cancelada)
    const totalClases = clasesDelDocente.length
    const clasesConAsistencia = clasesDelDocente.filter(
      cd => cd.clase._count.asistencias > 0
    ).length

    const porcentajeDelPeriodo = totalClasesPeriodo > 0
      ? Math.round((totalClases / totalClasesPeriodo) * 100)
      : 0

    const ultimaClase = clasesDelDocente.length > 0
      ? clasesDelDocente[0].clase.fecha
      : null

    return NextResponse.json({
      docente: {
        id: docente.id,
        nombre: docente.nombre,
        apellido: docente.apellido,
        tipo: docente.tipo,
        activo: docente.activo,
        createdAt: docente.createdAt
      },
      estadisticas: {
        totalClases,
        clasesConAsistencia,
        porcentajeDelPeriodo,
        ultimaClase
      },
      clases: clasesDelDocente.map(cd => ({
        id: cd.clase.id,
        fecha: cd.clase.fecha.toISOString().split('T')[0],
        diaSemana: cd.clase.diaSemana,
        titulo: cd.clase.titulo,
        horaInicio: cd.clase.horaInicio,
        horaFin: cd.clase.horaFin,
        conAsistencia: cd.clase._count.asistencias > 0
      }))
    })
  } catch (error) {
    console.error('Error fetching docente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { nombre, apellido, tipo } = await request.json()

    // Validar que exista
    const existente = await prisma.docente.findUnique({ where: { id } })
    if (!existente) {
      return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })
    }

    // Validar tipo si se proporciona
    if (tipo && !['mejanej', 'capacitador'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo debe ser "mejanej" o "capacitador"' },
        { status: 400 }
      )
    }

    const docente = await prisma.docente.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(tipo && { tipo })
      }
    })

    return NextResponse.json({
      success: true,
      docente: {
        id: docente.id,
        nombre: docente.nombre,
        apellido: docente.apellido,
        tipo: docente.tipo
      }
    })
  } catch (error) {
    console.error('Error updating docente:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
