/**
 * Script de migración para crear las 3 kitot y migrar datos existentes.
 *
 * Ejecutar con: npx tsx prisma/seed-kitot.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando migración de kitot...\n')

  // 1. Crear las 3 kitot con passwords temporales
  console.log('1. Creando kitot...')

  const kitotData = [
    {
      nombre: 'najshon',
      nombreDisplay: 'Najshón',
      anio: 1,
      colorHex: '#10B981', // verde
      password: 'najshon2025'
    },
    {
      nombre: 'shinun',
      nombreDisplay: 'Shinun',
      anio: 2,
      colorHex: '#3B82F6', // azul
      password: 'shinun2025'
    },
    {
      nombre: 'heschel',
      nombreDisplay: 'Heschel',
      anio: 3,
      colorHex: '#8B5CF6', // violeta
      password: 'heschel2025'
    },
  ]

  const kitot: Record<string, { id: string }> = {}

  for (const kita of kitotData) {
    const existing = await prisma.kita.findUnique({
      where: { nombre: kita.nombre }
    })

    if (existing) {
      console.log(`   - ${kita.nombreDisplay} ya existe, saltando...`)
      kitot[kita.nombre] = existing
    } else {
      const passwordHash = await bcrypt.hash(kita.password, 10)
      const created = await prisma.kita.create({
        data: {
          nombre: kita.nombre,
          nombreDisplay: kita.nombreDisplay,
          anio: kita.anio,
          colorHex: kita.colorHex,
          passwordHash,
        }
      })
      console.log(`   - ${kita.nombreDisplay} creada (password temporal: ${kita.password})`)
      kitot[kita.nombre] = created
    }
  }

  const shinun = kitot['shinun']

  // 2. Migrar talmidim existentes a Shinun (como indicó el usuario)
  console.log('\n2. Migrando talmidim a Shinun...')

  const talmidimSinKita = await prisma.talmid.count({
    where: { kitaId: null }
  })

  if (talmidimSinKita > 0) {
    await prisma.talmid.updateMany({
      where: { kitaId: null },
      data: { kitaId: shinun.id }
    })
    console.log(`   - ${talmidimSinKita} talmidim migrados a Shinun`)
  } else {
    console.log('   - No hay talmidim sin kitá asignada')
  }

  // 3. Migrar clases existentes a Shinun
  console.log('\n3. Migrando clases a Shinun...')

  const clasesSinKita = await prisma.clase.findMany({
    where: {
      kitot: { none: {} }
    },
    select: { id: true }
  })

  if (clasesSinKita.length > 0) {
    await prisma.claseKita.createMany({
      data: clasesSinKita.map(clase => ({
        claseId: clase.id,
        kitaId: shinun.id
      }))
    })
    console.log(`   - ${clasesSinKita.length} clases migradas a Shinun`)
  } else {
    console.log('   - No hay clases sin kitá asignada')
  }

  // 4. Resumen
  console.log('\n========================================')
  console.log('Migración completada!')
  console.log('========================================')
  console.log('\nPasswords temporales (CAMBIALOS!):')
  for (const kita of kitotData) {
    console.log(`   - ${kita.nombreDisplay}: ${kita.password}`)
  }
  console.log('\nPara cambiar un password, podés usar:')
  console.log('   npx prisma studio')
  console.log('   y actualizar el campo passwordHash con un hash bcrypt')
}

main()
  .catch((e) => {
    console.error('Error en la migración:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
