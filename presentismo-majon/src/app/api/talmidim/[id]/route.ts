import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const talmid = await prisma.talmid.findUnique({
      where: {
        id,
        kitaId: session.kitaId, // Verificar que pertenece a la kitá
      },
      include: {
        notas: {
          orderBy: { createdAt: 'desc' },
        },
        asistencias: {
          include: {
            clase: true,
          },
          orderBy: {
            clase: { fecha: 'desc' },
          },
          take: 20,
        },
      },
    })

    if (!talmid) {
      return NextResponse.json({ error: 'Talmid no encontrado' }, { status: 404 })
    }

    // Calcular estadisticas de asistencia
    const todasAsistencias = await prisma.asistencia.findMany({
      where: { talmidId: id },
    })

    const stats = todasAsistencias.reduce(
      (acc, a) => {
        if (a.estado === 'presente') acc.presentes++
        else if (a.estado === 'tardanza') acc.tardanzas++
        else if (a.estado === 'ausente') acc.ausentes++
        return acc
      },
      { presentes: 0, tardanzas: 0, ausentes: 0 }
    )

    const totalClases = stats.presentes + stats.tardanzas + stats.ausentes
    const porcentajeAsistencia = totalClases > 0
      ? Math.round(((stats.presentes + stats.tardanzas) / totalClases) * 100)
      : 0

    return NextResponse.json({
      talmid: {
        id: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        fechaNacimiento: talmid.fechaNacimiento?.toISOString().split('T')[0] || null,
        telefono: talmid.telefono,
        email: talmid.email,
        fotoUrl: talmid.fotoUrl,
        activo: talmid.activo,
        createdAt: talmid.createdAt.toISOString(),
      },
      notas: talmid.notas.map((n) => ({
        id: n.id,
        categoria: n.categoria,
        contenido: n.contenido,
        createdAt: n.createdAt.toISOString(),
      })),
      asistencias: talmid.asistencias.map((a) => ({
        id: a.id,
        fecha: a.clase.fecha.toISOString().split('T')[0],
        diaSemana: a.clase.diaSemana,
        estado: a.estado,
        justificacion: a.justificacion,
      })),
      estadisticas: {
        ...stats,
        totalClases,
        porcentajeAsistencia,
      },
    })
  } catch (error) {
    console.error('Error fetching talmid:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, apellido, fechaNacimiento, telefono, email, fotoUrl } = body

    const talmid = await prisma.talmid.update({
      where: {
        id,
        kitaId: session.kitaId, // Verificar que pertenece a la kitá
      },
      data: {
        nombre: nombre || undefined,
        apellido: apellido || undefined,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        telefono: telefono !== undefined ? telefono : undefined,
        email: email !== undefined ? email : undefined,
        fotoUrl: fotoUrl !== undefined ? fotoUrl : undefined,
      },
    })

    return NextResponse.json({
      success: true,
      talmid: {
        id: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        fechaNacimiento: talmid.fechaNacimiento?.toISOString().split('T')[0] || null,
        telefono: talmid.telefono,
        email: talmid.email,
        fotoUrl: talmid.fotoUrl,
      },
    })
  } catch (error) {
    console.error('Error updating talmid:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
