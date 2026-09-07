/**
 * Migra las fotos de talmidim guardadas como base64 en `fotoUrl`
 * a objetos en Cloudflare R2, dejando la key en `fotoKey`.
 *
 * Correr una sola vez por base de datos:
 *   npm run fotos:migrar
 *
 * Es idempotente: saltea los talmidim que ya tienen `fotoKey`.
 */
import { PrismaClient } from '@prisma/client'
import { subirObjeto, r2Configurado } from '../src/lib/r2'
import { extensionParaTipo, esTipoDeImagenPermitido } from '../src/lib/foto'

const prisma = new PrismaClient()

// Parsea un data URL: data:image/jpeg;base64,/9j/4AAQ...
function parseDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } | null {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(dataUrl)
  if (!match) return null

  const [, contentType, base64] = match
  return { contentType, buffer: Buffer.from(base64, 'base64') }
}

async function main() {
  if (!r2Configurado()) {
    throw new Error(
      'Faltan variables de R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)'
    )
  }

  const talmidim = await prisma.talmid.findMany({
    where: { fotoKey: null, NOT: { fotoUrl: null } },
    select: { id: true, nombre: true, apellido: true, fotoUrl: true },
  })

  console.log(`Talmidim con foto por migrar: ${talmidim.length}`)

  let migrados = 0
  let salteados = 0

  for (const talmid of talmidim) {
    const nombre = `${talmid.nombre} ${talmid.apellido}`
    const parsed = parseDataUrl(talmid.fotoUrl!)

    if (!parsed) {
      // Puede ser una URL http vieja: la dejamos como está.
      console.log(`  - ${nombre}: fotoUrl no es base64, se deja sin tocar`)
      salteados++
      continue
    }

    if (!esTipoDeImagenPermitido(parsed.contentType)) {
      console.log(`  - ${nombre}: tipo ${parsed.contentType} no soportado, se saltea`)
      salteados++
      continue
    }

    const key = `talmidim/${talmid.id}/${crypto.randomUUID()}.${extensionParaTipo(parsed.contentType)}`

    await subirObjeto(key, parsed.buffer, parsed.contentType)
    await prisma.talmid.update({
      where: { id: talmid.id },
      data: { fotoKey: key, fotoUrl: null },
    })

    migrados++
    console.log(`  ✓ ${nombre} → ${key} (${Math.round(parsed.buffer.length / 1024)} KB)`)
  }

  console.log(`\nListo. Migrados: ${migrados}. Salteados: ${salteados}.`)
}

main()
  .catch((error) => {
    console.error('Error en la migración:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
