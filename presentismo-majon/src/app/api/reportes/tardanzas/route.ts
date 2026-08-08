import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { detallarClasesTalmid } from '@/lib/asistencia'
import { getClasesComputables } from '@/lib/asistencia.server'

export async function GET() {
  try {
    // Obtener sesión con kitá
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const [talmidim, clases] = await Promise.all([
      prisma.talmid.findMany({
        where: { activo: true, kitaId: session.kitaId },
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: {
          asistencias: { select: { claseId: true, estado: true, justificacion: true } },
          ausenciasProgramadas: {
            where: { activa: true },
            select: { fechaInicio: true, fechaFin: true, justificacion: true },
          },
        },
      }),
      getClasesComputables(session.kitaId),
    ])

    let totalJustificadas = 0
    let totalInjustificadas = 0
    let totalTardanzas = 0

    const ranking = talmidim
      .map((talmid) => {
        let tardanzas = 0
        let justificadas = 0
        let injustificadas = 0

        const detalle = detallarClasesTalmid({
          clases,
          asistencias: talmid.asistencias,
          ausenciasProgramadas: talmid.ausenciasProgramadas,
          desde: talmid.createdAt,
        })

        for (const d of detalle) {
          if (d.tipo === 'tardanzas') {
            tardanzas++
          } else if (d.tipo === 'justificadas') {
            // Ausencia avisada de antemano
            justificadas++
          } else if (d.tipo === 'ausentes') {
            if (d.justificacion && d.justificacion.trim() !== '') justificadas++
            else injustificadas++
          } else if (d.tipo === 'sinRegistro') {
            // No lo marcaron en una clase donde se tomó asistencia
            injustificadas++
          }
        }

        totalTardanzas += tardanzas
        totalJustificadas += justificadas
        totalInjustificadas += injustificadas

        return {
          id: talmid.id,
          nombre: talmid.nombre,
          apellido: talmid.apellido,
          tardanzas,
          justificadas,
          injustificadas,
        }
      })
      .filter((t) => t.tardanzas > 0)
      .sort((a, b) => b.tardanzas - a.tardanzas || a.apellido.localeCompare(b.apellido))

    return NextResponse.json({
      summary: {
        justificadas: totalJustificadas,
        injustificadas: totalInjustificadas,
        tardanzas: totalTardanzas,
      },
      ranking,
    })
  } catch (error) {
    console.error('Error fetching tardanzas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
