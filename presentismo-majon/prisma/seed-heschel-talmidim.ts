/**
 * Script para agregar talmidim a la kitá de Heschel.
 *
 * Ejecutar con: npx tsx prisma/seed-heschel-talmidim.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Lista de talmidim de Heschel (3° año)
const talmidimHeschel = [
  { nombre: 'Ethan Sai', apellido: 'Cohen' },
  { nombre: 'Julián', apellido: 'Berjman' },
  { nombre: 'Micaela', apellido: 'Pecar' },
  { nombre: 'Liam', apellido: 'Koirach' },
  { nombre: 'Michal', apellido: 'Tesler' },
  { nombre: 'Martina', apellido: 'Tambal' },
  { nombre: 'Micaela', apellido: 'Berman' },
  { nombre: 'Morena', apellido: 'Zalcman' },
  { nombre: 'Micaela', apellido: 'Vugin' },
  { nombre: 'Camila', apellido: 'Salem' },
  { nombre: 'Alan', apellido: 'Fajgenblat' },
  { nombre: 'Mica', apellido: 'Sevillia' },
  { nombre: 'Valentín', apellido: 'Mali' },
  { nombre: 'Zoe', apellido: 'Ehrenfreund' },
  { nombre: 'Nikita', apellido: 'Said' },
  { nombre: 'Sabrina', apellido: 'Gordon' },
  { nombre: 'Kiara', apellido: 'Brukiew' },
  { nombre: 'Matías', apellido: 'Tenenbaum' },
  { nombre: 'Micaela', apellido: 'Schilman' },
  { nombre: 'Brigitte', apellido: 'Blau' },
  { nombre: 'Ivan', apellido: 'Luchinsky' },
  { nombre: 'Nicolás', apellido: 'Cukier' },
  { nombre: 'Magali', apellido: 'Slavkin' },
  { nombre: 'Noa', apellido: 'Bryk' },
  { nombre: 'Bruno', apellido: 'Harari' },
]

async function main() {
  console.log('Agregando talmidim a Heschel...\n')

  // 1. Buscar la kitá de Heschel
  const heschel = await prisma.kita.findUnique({
    where: { nombre: 'heschel' }
  })

  if (!heschel) {
    throw new Error('No se encontró la kitá de Heschel. Ejecutá primero seed-kitot.ts')
  }

  console.log(`Kitá encontrada: ${heschel.nombreDisplay} (ID: ${heschel.id})\n`)

  // 2. Crear los talmidim
  let creados = 0
  let existentes = 0

  for (const talmid of talmidimHeschel) {
    // Verificar si ya existe (por nombre y apellido)
    const existing = await prisma.talmid.findFirst({
      where: {
        nombre: talmid.nombre,
        apellido: talmid.apellido,
        kitaId: heschel.id
      }
    })

    if (existing) {
      console.log(`   - ${talmid.nombre} ${talmid.apellido} ya existe, saltando...`)
      existentes++
    } else {
      await prisma.talmid.create({
        data: {
          nombre: talmid.nombre,
          apellido: talmid.apellido,
          kitaId: heschel.id,
          activo: true
        }
      })
      console.log(`   ✓ ${talmid.nombre} ${talmid.apellido} creado`)
      creados++
    }
  }

  // 3. Resumen
  console.log('\n========================================')
  console.log('Proceso completado!')
  console.log('========================================')
  console.log(`\nTalmidim creados: ${creados}`)
  console.log(`Talmidim existentes (saltados): ${existentes}`)
  console.log(`Total en lista: ${talmidimHeschel.length}`)

  // Mostrar total actual en Heschel
  const totalHeschel = await prisma.talmid.count({
    where: { kitaId: heschel.id }
  })
  console.log(`\nTotal talmidim en Heschel: ${totalHeschel}`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
