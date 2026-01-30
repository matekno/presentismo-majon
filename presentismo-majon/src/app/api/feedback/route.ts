import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Obtener todos los feedbacks con datos relacionados
    const feedbacks = await prisma.feedback.findMany({
      include: {
        talmid: {
          select: { id: true, nombre: true, apellido: true }
        },
        clase: {
          select: {
            id: true,
            fecha: true,
            titulo: true,
            docentes: {
              include: {
                docente: {
                  select: { id: true, nombre: true, apellido: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calcular estadísticas por docente
    const docenteStats: Record<string, {
      nombre: string
      apellido: string
      totalRatings: number
      sumRatings: number
      feedbackCount: number
    }> = {}

    // Estadísticas generales de clases
    let totalClaseRating = 0
    let claseRatingCount = 0

    for (const feedback of feedbacks) {
      // Sumar rating de clase
      totalClaseRating += feedback.claseRating
      claseRatingCount++

      // Procesar feedback de docentes
      if (feedback.docentesFeedback) {
        try {
          const docentesFeedback = JSON.parse(feedback.docentesFeedback) as Array<{
            docenteId: string
            rating: number
            comentario?: string
          }>

          for (const df of docentesFeedback) {
            if (!docenteStats[df.docenteId]) {
              // Buscar nombre del docente
              const docente = feedback.clase.docentes.find(
                cd => cd.docente.id === df.docenteId
              )?.docente

              if (docente) {
                docenteStats[df.docenteId] = {
                  nombre: docente.nombre,
                  apellido: docente.apellido,
                  totalRatings: 0,
                  sumRatings: 0,
                  feedbackCount: 0
                }
              }
            }

            if (docenteStats[df.docenteId] && df.rating > 0) {
              docenteStats[df.docenteId].totalRatings++
              docenteStats[df.docenteId].sumRatings += df.rating
              docenteStats[df.docenteId].feedbackCount++
            }
          }
        } catch {
          // Ignorar errores de parsing
        }
      }
    }

    // Convertir stats de docentes a array con promedios
    const docentesRanking = Object.entries(docenteStats)
      .map(([id, stats]) => ({
        id,
        nombre: stats.nombre,
        apellido: stats.apellido,
        promedio: stats.totalRatings > 0
          ? Math.round((stats.sumRatings / stats.totalRatings) * 10) / 10
          : 0,
        cantidadFeedbacks: stats.feedbackCount
      }))
      .filter(d => d.cantidadFeedbacks > 0)
      .sort((a, b) => b.promedio - a.promedio)

    // Formatear feedbacks recientes
    const feedbacksRecientes = feedbacks.slice(0, 20).map(f => ({
      id: f.id,
      claseRating: f.claseRating,
      claseComentario: f.claseComentario,
      createdAt: f.createdAt.toISOString(),
      talmid: {
        nombre: f.talmid.nombre,
        apellido: f.talmid.apellido
      },
      clase: {
        fecha: f.clase.fecha.toISOString(),
        titulo: f.clase.titulo
      },
      docentesFeedback: f.docentesFeedback ? JSON.parse(f.docentesFeedback) : []
    }))

    return NextResponse.json({
      stats: {
        totalFeedbacks: feedbacks.length,
        promedioClase: claseRatingCount > 0
          ? Math.round((totalClaseRating / claseRatingCount) * 10) / 10
          : 0
      },
      docentesRanking,
      feedbacksRecientes
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
