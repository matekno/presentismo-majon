import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/kitot - Listar kitot activas (para el selector de login)
export async function GET() {
  try {
    const kitot = await prisma.kita.findMany({
      where: { activa: true },
      orderBy: { anio: 'asc' },
      select: {
        id: true,
        nombre: true,
        nombreDisplay: true,
        anio: true,
        colorHex: true,
      },
    })

    return NextResponse.json({ kitot })
  } catch (error) {
    console.error('Error al obtener kitot:', error)
    return NextResponse.json(
      { error: 'Error al obtener kitot' },
      { status: 500 }
    )
  }
}
