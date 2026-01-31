import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

// POST /api/cronograma/conflictos - Verificar si hay clases existentes para las kitot en una fecha
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { fecha, kitaIds } = await request.json()

    if (!fecha || !kitaIds || !Array.isArray(kitaIds) || kitaIds.length === 0) {
      return NextResponse.json({ error: 'Fecha y kitaIds requeridos' }, { status: 400 })
    }

    // Parsear fecha
    const [year, month, day] = fecha.split('-').map(Number)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59)

    // Buscar clases existentes para las kitot seleccionadas (excluyendo la kitá actual)
    const otrasKitaIds = kitaIds.filter((id: string) => id !== session.kitaId)

    if (otrasKitaIds.length === 0) {
      return NextResponse.json({ conflictos: [] })
    }

    const clasesConflicto = await prisma.clase.findMany({
      where: {
        fecha: {
          gte: startOfDay,
          lte: endOfDay,
        },
        kitot: {
          some: { kitaId: { in: otrasKitaIds } }
        }
      },
      include: {
        kitot: {
          include: { kita: true }
        },
        docentes: {
          include: { docente: true }
        }
      }
    })

    const conflictos = clasesConflicto.map(clase => ({
      id: clase.id,
      titulo: clase.titulo,
      horaInicio: clase.horaInicio,
      horaFin: clase.horaFin,
      kitot: clase.kitot.map(ck => ({
        id: ck.kita.id,
        nombre: ck.kita.nombre,
        nombreDisplay: ck.kita.nombreDisplay,
        colorHex: ck.kita.colorHex
      })),
      docentes: clase.docentes.map(cd => ({
        nombre: cd.docente.nombre,
        apellido: cd.docente.apellido
      }))
    }))

    return NextResponse.json({ conflictos })
  } catch (error) {
    console.error('Error verificando conflictos:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
