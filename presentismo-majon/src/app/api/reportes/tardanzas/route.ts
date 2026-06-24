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
      where: { activo: true, kitaId: session.kitaId },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      include: {
        asistencias: { include: { clase: true } },
        ausenciasProgramadas: { where: { activa: true } },
      },
    })

    let totalJustificadas = 0
    let totalInjustificadas = 0
    let totalTardanzas = 0

    const ranking = talmidim
      .map((talmid) => {
        let tardanzas = 0
        let justificadas = 0
        let injustificadas = 0

        for (const a of talmid.asistencias) {
          if (a.estado === 'tardanza') {
            tardanzas++
          } else if (a.estado === 'ausente') {
            const tieneJustificacion = !!a.justificacion && a.justificacion.trim() !== ''
            const cubiertaPorPrograma = talmid.ausenciasProgramadas.some(
              (ap) => ap.fechaInicio <= a.clase.fecha && ap.fechaFin >= a.clase.fecha
            )
            if (tieneJustificacion || cubiertaPorPrograma) justificadas++
            else injustificadas++
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
