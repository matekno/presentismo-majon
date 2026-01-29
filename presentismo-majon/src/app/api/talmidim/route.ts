import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const talmidim = await prisma.talmid.findMany({
      where: { activo: true },
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
