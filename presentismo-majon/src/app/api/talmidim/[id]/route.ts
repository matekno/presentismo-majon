import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcularStatsTalmid, detallarClasesTalmid, toDayKey } from '@/lib/asistencia'
import { getClasesComputables } from '@/lib/asistencia.server'
import { fotoUrlPublica } from '@/lib/foto'

const MAX_HISTORIAL = 20

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
          select: { claseId: true, estado: true, justificacion: true },
        },
        ausenciasProgramadas: {
          where: { activa: true },
          select: { fechaInicio: true, fechaFin: true, justificacion: true },
        },
      },
    })

    if (!talmid) {
      return NextResponse.json({ error: 'Talmid no encontrado' }, { status: 404 })
    }

    // Estadisticas sobre las clases que le correspondian: de su kitá, pasadas,
    // no canceladas y con asistencia tomada
    const args = {
      clases: await getClasesComputables(session.kitaId),
      asistencias: talmid.asistencias,
      ausenciasProgramadas: talmid.ausenciasProgramadas,
      desde: talmid.createdAt,
    }
    const stats = calcularStatsTalmid(args)
    const historial = detallarClasesTalmid(args).slice(0, MAX_HISTORIAL)

    return NextResponse.json({
      talmid: {
        id: talmid.id,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        fechaNacimiento: talmid.fechaNacimiento?.toISOString().split('T')[0] || null,
        telefono: talmid.telefono,
        email: talmid.email,
        fotoUrl: fotoUrlPublica(talmid),
        activo: talmid.activo,
        createdAt: talmid.createdAt.toISOString(),
      },
      notas: talmid.notas.map((n) => ({
        id: n.id,
        categoria: n.categoria,
        contenido: n.contenido,
        createdAt: n.createdAt.toISOString(),
      })),
      asistencias: historial.map((d) => ({
        id: d.claseId,
        fecha: toDayKey(d.fecha),
        diaSemana: d.diaSemana,
        tipo: d.tipo,
        justificacion: d.justificacion,
      })),
      estadisticas: {
        presentes: stats.presentes,
        tardanzas: stats.tardanzas,
        ausentes: stats.ausentes,
        sinRegistro: stats.sinRegistro,
        justificadas: stats.justificadas,
        totalComputables: stats.totalComputables,
        porcentajeAsistencia: stats.porcentaje,
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
    const { nombre, apellido, fechaNacimiento, telefono, email, activo } = body

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
        activo: typeof activo === 'boolean' ? activo : undefined, // Reactivar baja
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
        fotoUrl: fotoUrlPublica(talmid),
      },
    })
  } catch (error) {
    console.error('Error updating talmid:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// Dar de baja (soft delete): marca activo = false. Los datos se conservan.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    await prisma.talmid.update({
      where: {
        id,
        kitaId: session.kitaId, // Verificar que pertenece a la kitá
      },
      data: { activo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deactivating talmid:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
