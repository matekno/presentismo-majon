export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function isMartes(date: Date): boolean {
  return date.getDay() === 2
}

export function isViernes(date: Date): boolean {
  return date.getDay() === 5
}

export function isDiaDeClase(date: Date): boolean {
  return isMartes(date) || isViernes(date)
}

export function getHorarioClase(date: Date): { inicio: string; fin: string } {
  if (isMartes(date)) {
    return { inicio: '18:30', fin: '20:30' }
  }
  return { inicio: '17:30', fin: '21:00' }
}

export function getDiaSemana(date: Date): 'martes' | 'viernes' | null {
  if (isMartes(date)) return 'martes'
  if (isViernes(date)) return 'viernes'
  return null
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}
