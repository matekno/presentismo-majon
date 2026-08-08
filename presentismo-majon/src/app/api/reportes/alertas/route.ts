import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { calcularStatsTalmid } from '@/lib/asistencia'
import { getClasesComputables } from '@/lib/asistencia.server'

const UMBRAL = 70 // % de asistencia por debajo del cual se considera "en riesgo"
const RACHA_MIN = 3 // Ausencias consecutivas (más recientes) que disparan alerta

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
          asistencias: { select: { claseId: true, estado: true } },
          ausenciasProgramadas: {
            where: { activa: true },
            select: { fechaInicio: true, fechaFin: true },
          },
        },
      }),
      // Ordenadas de la más reciente a la más antigua: la racha se cuenta así
      getClasesComputables(session.kitaId),
    ])

    const alertas = talmidim
      .map((talmid) => {
        const stats = calcularStatsTalmid({
          clases,
          asistencias: talmid.asistencias,
          ausenciasProgramadas: talmid.ausenciasProgramadas,
          desde: talmid.createdAt,
        })

        const motivos: ('low' | 'streak')[] = []
        if (stats.totalComputables > 0 && stats.porcentaje < UMBRAL) motivos.push('low')
        if (stats.rachaActual >= RACHA_MIN) motivos.push('streak')

        return {
          id: talmid.id,
          nombre: talmid.nombre,
          apellido: talmid.apellido,
          presentes: stats.presentes,
          tardanzas: stats.tardanzas,
          ausentes: stats.ausentes,
          sinRegistro: stats.sinRegistro,
          justificadas: stats.justificadas,
          totalComputables: stats.totalComputables,
          porcentaje: stats.porcentaje,
          rachaActual: stats.rachaActual,
          motivos,
        }
      })
      .filter((t) => t.motivos.length > 0)
      // Peor primero: menor % y luego racha más larga
      .sort((a, b) => a.porcentaje - b.porcentaje || b.rachaActual - a.rachaActual)

    return NextResponse.json({
      umbral: UMBRAL,
      rachaMin: RACHA_MIN,
      totalClases: clases.length,
      alertas,
    })
  } catch (error) {
    console.error('Error fetching alertas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
