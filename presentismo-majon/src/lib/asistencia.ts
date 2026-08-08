/**
 * Cálculo unificado del porcentaje de asistencia.
 *
 * Módulo puro (sin acceso a datos) para que lo puedan usar también los
 * componentes de cliente. La consulta vive en `@/lib/asistencia.server`.
 *
 * Criterio: el denominador son las clases que le CORRESPONDÍAN al talmid, no
 * las veces que lo marcaron. Una clase le corresponde si:
 *   - es de su kitá y no está cancelada,
 *   - ya ocurrió (hasta hoy inclusive),
 *   - se tomó asistencia en ella,
 *   - el talmid ya estaba de alta a esa fecha,
 *   - y no está cubierta por una ausencia programada activa.
 *
 * Que no lo hayan marcado en una clase donde sí se tomó asistencia cuenta
 * como ausencia (`sinRegistro`), no como "no computa".
 */

/**
 * Clave de día (YYYY-MM-DD) para comparar fechas sin que interfiera la hora.
 * Las clases se guardan a medianoche local (`new Date(y, m-1, d)`) y las
 * ausencias programadas a medianoche UTC (`new Date('YYYY-MM-DD')`), así que
 * comparar los Date crudos da falsos negativos: una ausencia programada de un
 * solo día nunca llegaba a matchear su propia clase.
 */
export function toDayKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

export interface ClaseComputable {
  id: string
  fecha: Date
  diaSemana: string
}

interface AsistenciaMinima {
  claseId: string
  estado: string
  justificacion?: string | null
}

interface AusenciaProgramadaMinima {
  fechaInicio: Date
  fechaFin: Date
  justificacion?: string
}

export interface StatsAsistencia {
  /** Marcado presente. */
  presentes: number
  /** Marcado tardanza. Cuenta como asistencia en el porcentaje. */
  tardanzas: number
  /** Marcado ausente. */
  ausentes: number
  /** Se tomó asistencia en la clase pero al talmid no lo marcaron. Cuenta como ausencia. */
  sinRegistro: number
  /** Cubierta por ausencia programada activa. Queda FUERA del denominador. */
  justificadas: number
  /** Denominador: presentes + tardanzas + ausentes + sinRegistro. */
  totalComputables: number
  porcentaje: number
}

/** Cómo computa una clase para un talmid. Coincide con las claves de StatsAsistencia. */
export type TipoAsistencia =
  | 'presentes'
  | 'tardanzas'
  | 'ausentes'
  | 'sinRegistro'
  | 'justificadas'

/**
 * El campo `justificacion` de la asistencia NO exime: es obligatorio para toda
 * ausencia (regla de negocio), así que descontarlo dejaría a todos en 100%.
 * Solo exime una `AusenciaProgramada` activa, que se avisa de antemano.
 */
export function clasificarAsistencia(
  estado: string | null | undefined,
  tieneAusenciaProgramada = false
): TipoAsistencia {
  // Vino igual: cuenta como asistencia aunque tuviera ausencia programada
  if (estado === 'presente') return 'presentes'
  if (estado === 'tardanza') return 'tardanzas'
  if (tieneAusenciaProgramada) return 'justificadas'
  if (estado === 'ausente') return 'ausentes'
  return 'sinRegistro'
}

/** Agrega una lista de clasificaciones en el total y el porcentaje final. */
export function resumir(tipos: Iterable<TipoAsistencia>): StatsAsistencia {
  const stats: StatsAsistencia = {
    presentes: 0,
    tardanzas: 0,
    ausentes: 0,
    sinRegistro: 0,
    justificadas: 0,
    totalComputables: 0,
    porcentaje: 0,
  }

  for (const tipo of tipos) stats[tipo]++

  stats.totalComputables =
    stats.presentes + stats.tardanzas + stats.ausentes + stats.sinRegistro
  stats.porcentaje =
    stats.totalComputables > 0
      ? Math.round(((stats.presentes + stats.tardanzas) / stats.totalComputables) * 100)
      : 0

  return stats
}

function cubiertaPorAusenciaProgramada(
  ausencias: AusenciaProgramadaMinima[],
  claseKey: string
): boolean {
  return ausencias.some(
    (ap) => toDayKey(ap.fechaInicio) <= claseKey && toDayKey(ap.fechaFin) >= claseKey
  )
}

export interface DetalleClase {
  claseId: string
  fecha: Date
  diaSemana: string
  tipo: TipoAsistencia
  justificacion: string | null
}

interface ArgsTalmid {
  clases: ClaseComputable[]
  asistencias: AsistenciaMinima[]
  ausenciasProgramadas?: AusenciaProgramadaMinima[]
  /** Alta del talmid: no se le cuentan clases anteriores a su ingreso. */
  desde?: Date | null
}

/**
 * Clase por clase, cómo computa cada una para el talmid.
 * Respeta el orden de `clases` (que viene por fecha descendente).
 */
export function detallarClasesTalmid({
  clases,
  asistencias,
  ausenciasProgramadas = [],
  desde,
}: ArgsTalmid): DetalleClase[] {
  const porClase = new Map(asistencias.map((a) => [a.claseId, a]))
  const altaKey = desde ? toDayKey(desde) : null
  const detalle: DetalleClase[] = []

  for (const clase of clases) {
    const claseKey = toDayKey(clase.fecha)

    // Antes del alta del talmid la clase no le correspondía
    if (altaKey && claseKey < altaKey) continue

    const asistencia = porClase.get(clase.id)
    const programada = ausenciasProgramadas.find(
      (ap) => toDayKey(ap.fechaInicio) <= claseKey && toDayKey(ap.fechaFin) >= claseKey
    )
    const tipo = clasificarAsistencia(asistencia?.estado, !!programada)

    detalle.push({
      claseId: clase.id,
      fecha: clase.fecha,
      diaSemana: clase.diaSemana,
      tipo,
      justificacion:
        tipo === 'justificadas'
          ? programada?.justificacion ?? null
          : asistencia?.justificacion ?? null,
    })
  }

  return detalle
}

/**
 * Estadísticas de un talmid sobre el universo de clases que le corresponden.
 * `clases` debe venir por fecha descendente para que `rachaActual` tenga sentido.
 */
export function calcularStatsTalmid(
  args: ArgsTalmid
): StatsAsistencia & { rachaActual: number } {
  const detalle = detallarClasesTalmid(args)

  // Ausencias consecutivas más recientes. Las justificadas no cortan la racha
  // ni suman; asistir (presente o tardanza) la corta.
  let rachaActual = 0
  for (const { tipo } of detalle) {
    if (tipo === 'ausentes' || tipo === 'sinRegistro') rachaActual++
    else if (tipo !== 'justificadas') break
  }

  return { ...resumir(detalle.map((d) => d.tipo)), rachaActual }
}

/**
 * Estadísticas de una clase sobre los talmidim que debían estar en ella.
 *
 * El padrón son los talmidim activos de la kitá que ya estaban de alta a esa
 * fecha, más cualquiera con registro en la clase (así un talmid dado de baja
 * después no borra su asistencia de una clase pasada).
 */
export function calcularStatsClase({
  clase,
  talmidim,
  asistencias,
}: {
  clase: { fecha: Date }
  talmidim: { id: string; createdAt: Date; ausenciasProgramadas?: AusenciaProgramadaMinima[] }[]
  asistencias: { talmidId: string; estado: string }[]
}): StatsAsistencia {
  const claseKey = toDayKey(clase.fecha)
  const porTalmid = new Map(asistencias.map((a) => [a.talmidId, a.estado]))
  const programadasPorTalmid = new Map(
    talmidim.map((t) => [t.id, t.ausenciasProgramadas ?? []])
  )

  const padron = new Set(
    talmidim.filter((t) => toDayKey(t.createdAt) <= claseKey).map((t) => t.id)
  )
  for (const a of asistencias) padron.add(a.talmidId)

  return resumir(
    [...padron].map((talmidId) =>
      clasificarAsistencia(
        porTalmid.get(talmidId),
        cubiertaPorAusenciaProgramada(programadasPorTalmid.get(talmidId) ?? [], claseKey)
      )
    )
  )
}
