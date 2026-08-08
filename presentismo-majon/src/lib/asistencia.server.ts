import { prisma } from '@/lib/db'
import type { ClaseComputable } from '@/lib/asistencia'

/**
 * Clases que le corresponden a una kitá: no canceladas, ya ocurridas (hasta hoy
 * inclusive) y con asistencia efectivamente tomada. Ordenadas de la más reciente
 * a la más antigua, que es como se calculan las rachas de ausencias.
 *
 * Una clase sin ningún registro se excluye a propósito: es asistencia que falta
 * cargar, no una inasistencia de los talmidim.
 */
export async function getClasesComputables(kitaId: string): Promise<ClaseComputable[]> {
  const finDeHoy = new Date()
  finDeHoy.setHours(23, 59, 59, 999)

  return prisma.clase.findMany({
    where: {
      cancelada: false,
      fecha: { lte: finDeHoy },
      kitot: { some: { kitaId } },
      asistencias: { some: {} },
    },
    select: { id: true, fecha: true, diaSemana: true },
    orderBy: { fecha: 'desc' },
  })
}
