import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const UMBRAL = 70 // % de asistencia por debajo del cual se considera "en riesgo"
const RACHA_MIN = 3 // Ausencias consecutivas (más recientes) que disparan alerta

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
        asistencias: {
          include: { clase: true },
          // Más reciente primero, para calcular la racha actual de ausencias
          orderBy: { clase: { fecha: 'desc' } },
        },
      },
    })

    const totalClases = await prisma.clase.count({
      where: {
        cancelada: false,
        kitot: { some: { kitaId: session.kitaId } },
      },
    })

    const alertas = talmidim
      .map((talmid) => {
        const asistencias = talmid.asistencias
        const presentes = asistencias.filter((a) => a.estado === 'presente').length
        const tardanzas = asistencias.filter((a) => a.estado === 'tardanza').length
        const ausentes = asistencias.filter((a) => a.estado === 'ausente').length
        const totalRegistros = presentes + tardanzas + ausentes
        const porcentaje =
          totalRegistros > 0
            ? Math.round(((presentes + tardanzas) / totalRegistros) * 100)
            : 0

        // Racha actual: ausencias consecutivas empezando por la clase más reciente
        let rachaActual = 0
        for (const a of asistencias) {
          if (a.estado === 'ausente') rachaActual++
          else break
        }

        const motivos: ('low' | 'streak')[] = []
        if (totalRegistros > 0 && porcentaje < UMBRAL) motivos.push('low')
        if (rachaActual >= RACHA_MIN) motivos.push('streak')

        return {
          id: talmid.id,
          nombre: talmid.nombre,
          apellido: talmid.apellido,
          presentes,
          tardanzas,
          ausentes,
          totalRegistros,
          porcentaje,
          rachaActual,
          motivos,
        }
      })
      .filter((t) => t.motivos.length > 0)
      // Peor primero: menor % y luego racha más larga
      .sort((a, b) => a.porcentaje - b.porcentaje || b.rachaActual - a.rachaActual)

    return NextResponse.json({
      umbral: UMBRAL,
      rachaMin: RACHA_MIN,
      totalClases,
      alertas,
    })
  } catch (error) {
    console.error('Error fetching alertas:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
