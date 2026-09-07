import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { fotoUrlPublica } from '@/lib/foto'

export async function GET(request: NextRequest) {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // ?estado=inactivos → talmidim dados de baja. Por defecto, solo activos.
    const inactivos = request.nextUrl.searchParams.get('estado') === 'inactivos'

    const talmidim = await prisma.talmid.findMany({
      where: {
        activo: !inactivos,
        kitaId: session.kitaId, // Filtrar por kitá
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      include: {
        _count: {
          select: {
            asistencias: true,
            notas: true,
          },
        },
      },
    })

    return NextResponse.json({
      talmidim: talmidim.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        apellido: t.apellido,
        fechaNacimiento: t.fechaNacimiento?.toISOString().split('T')[0] || null,
        telefono: t.telefono,
        email: t.email,
        fotoUrl: fotoUrlPublica(t),
        cantidadAsistencias: t._count.asistencias,
        cantidadNotas: t._count.notas,
      })),
    })
  } catch (error) {
    console.error('Error fetching talmidim:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { nombre, apellido, fechaNacimiento, telefono, email } = body

    // Nombre y apellido son obligatorios
    if (!nombre?.trim() || !apellido?.trim()) {
      return NextResponse.json(
        { error: 'Nombre y apellido son requeridos' },
        { status: 400 }
      )
    }

    // Normalizar email (opcional, pero debe ser único si se provee)
    const emailNormalizado = email?.trim() ? email.trim().toLowerCase() : null

    if (emailNormalizado) {
      const existente = await prisma.talmid.findUnique({
        where: { email: emailNormalizado },
      })
      if (existente) {
        return NextResponse.json(
          { error: 'Ya existe un talmid con ese email' },
          { status: 409 }
        )
      }
    }

    const talmid = await prisma.talmid.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        telefono: telefono?.trim() || null,
        email: emailNormalizado,
        kitaId: session.kitaId, // Asignar a la kitá actual
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
        fotoUrl: null,
        cantidadAsistencias: 0,
        cantidadNotas: 0,
      },
    })
  } catch (error) {
    console.error('Error creating talmid:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
