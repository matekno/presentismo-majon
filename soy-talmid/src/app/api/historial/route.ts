import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { talmidId: session.talmidId },
      include: {
        clase: {
          select: {
            fecha: true,
            titulo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      feedbacks: feedbacks.map(f => ({
        id: f.id,
        claseRating: f.claseRating,
        claseComentario: f.claseComentario,
        createdAt: f.createdAt.toISOString(),
        clase: {
          fecha: f.clase.fecha.toISOString(),
          titulo: f.clase.titulo
        }
      }))
    })
  } catch (error) {
    console.error('Error fetching historial:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
