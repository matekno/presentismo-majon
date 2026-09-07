import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import {
  r2Configurado,
  subirObjeto,
  obtenerObjeto,
  borrarObjetoSilencioso,
} from '@/lib/r2'
import {
  MAX_FOTO_BYTES,
  esTipoDeImagenPermitido,
  nuevaFotoKey,
} from '@/lib/foto'

// Busca el talmid verificando que pertenezca a la kitá de la sesión.
// Devuelve null si no hay sesión o el talmid no es de la kitá.
async function getTalmidDeLaKita(id: string) {
  const session = await getSession()
  if (!session) return null

  return prisma.talmid.findUnique({
    where: { id, kitaId: session.kitaId },
    select: { id: true, fotoKey: true, fotoUrl: true },
  })
}

// GET: sirve la foto desde R2. El bucket es privado: esta ruta es el único
// acceso, y exige sesión de la kitá dueña del talmid.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const talmid = await getTalmidDeLaKita(id)
    if (!talmid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!talmid.fotoKey) {
      return NextResponse.json({ error: 'Sin foto' }, { status: 404 })
    }

    if (!r2Configurado()) {
      return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
    }

    const objeto = await obtenerObjeto(talmid.fotoKey)
    if (!objeto.Body) {
      return NextResponse.json({ error: 'Sin foto' }, { status: 404 })
    }

    return new Response(objeto.Body.transformToWebStream(), {
      headers: {
        'Content-Type': objeto.ContentType ?? 'image/jpeg',
        // La URL lleva ?v=updatedAt, así que el contenido de una URL dada
        // nunca cambia. Privada: no debe quedar en caches compartidas.
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error sirviendo foto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// POST: sube (o reemplaza) la foto. Espera FormData con el campo `foto`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const talmid = await getTalmidDeLaKita(id)
    if (!talmid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!r2Configurado()) {
      return NextResponse.json({ error: 'R2 no configurado' }, { status: 503 })
    }

    const formData = await request.formData()
    const archivo = formData.get('foto')

    if (!archivo || typeof archivo === 'string') {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 })
    }

    if (!esTipoDeImagenPermitido(archivo.type)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Usá JPG, PNG o WebP' },
        { status: 400 }
      )
    }

    if (archivo.size > MAX_FOTO_BYTES) {
      return NextResponse.json(
        { error: 'La imagen es muy grande. Maximo 2MB' },
        { status: 400 }
      )
    }

    const key = nuevaFotoKey(id, archivo.type)
    const buffer = Buffer.from(await archivo.arrayBuffer())

    await subirObjeto(key, buffer, archivo.type)

    const actualizado = await prisma.talmid.update({
      where: { id },
      // fotoUrl a null: si tenía un base64 legacy, ya no aplica.
      data: { fotoKey: key, fotoUrl: null },
      select: { id: true, updatedAt: true },
    })

    // Recién ahora borramos la anterior, con la nueva ya persistida.
    if (talmid.fotoKey) {
      await borrarObjetoSilencioso(talmid.fotoKey)
    }

    return NextResponse.json({
      success: true,
      fotoUrl: `/api/talmidim/${id}/foto?v=${actualizado.updatedAt.getTime()}`,
    })
  } catch (error) {
    console.error('Error subiendo foto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE: saca la foto del talmid y el objeto de R2.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const talmid = await getTalmidDeLaKita(id)
    if (!talmid) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await prisma.talmid.update({
      where: { id },
      data: { fotoKey: null, fotoUrl: null },
    })

    if (talmid.fotoKey) {
      await borrarObjetoSilencioso(talmid.fotoKey)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error borrando foto:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
