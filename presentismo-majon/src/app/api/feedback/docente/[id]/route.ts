import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docenteId } = await params

    // Obtener todos los feedbacks que mencionan a este docente
    const allFeedbacks = await prisma.feedback.findMany({
      include: {
        talmid: {
          select: { nombre: true, apellido: true }
        },
        clase: {
          select: {
            fecha: true,
            titulo: true,
            docentes: {
              where: { docenteId },
              select: { docenteId: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filtrar y procesar feedbacks que incluyen a este docente
    const feedbacksDelDocente: Array<{
      id: string
      rating: number
      comentario: string | null
      fecha: string
      claseTitulo: string | null
      talmidNombre: string
      createdAt: string
    }> = []

    let totalRating = 0
    let ratingCount = 0

    for (const feedback of allFeedbacks) {
      // Solo considerar clases donde este docente participó
      if (feedback.clase.docentes.length === 0) continue

      if (feedback.docentesFeedback) {
        try {
          const docentesFeedback = JSON.parse(feedback.docentesFeedback) as Array<{
            docenteId: string
            rating: number
            comentario?: string
          }>

          const feedbackDocente = docentesFeedback.find(df => df.docenteId === docenteId)

          if (feedbackDocente && feedbackDocente.rating > 0) {
            totalRating += feedbackDocente.rating
            ratingCount++

            feedbacksDelDocente.push({
              id: feedback.id,
              rating: feedbackDocente.rating,
              comentario: feedbackDocente.comentario || null,
              fecha: feedback.clase.fecha.toISOString(),
              claseTitulo: feedback.clase.titulo,
              talmidNombre: `${feedback.talmid.nombre} ${feedback.talmid.apellido}`,
              createdAt: feedback.createdAt.toISOString()
            })
          }
        } catch {
          // Ignorar errores de parsing
        }
      }
    }

    const promedio = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0

    return NextResponse.json({
      promedio,
      cantidadFeedbacks: ratingCount,
      feedbacks: feedbacksDelDocente.slice(0, 20) // Últimos 20
    })
  } catch (error) {
    console.error('Error fetching docente feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
