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

    const talmidim = await prisma.talmid.findMany({
      where: {
        activo: true,
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
        fotoUrl: t.fotoUrl,
        cantidadAsistencias: t._count.asistencias,
        cantidadNotas: t._count.notas,
      })),
    })
  } catch (error) {
    console.error('Error fetching talmidim:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
