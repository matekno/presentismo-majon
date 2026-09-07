/**
 * Backup completo de la base a un JSON con timestamp.
 *
 *   npm run db:backup
 *
 * Lee las tablas con SQL directo (no con el cliente tipado), así el dump
 * refleja lo que la base tiene realmente, aunque el schema de Prisma esté
 * adelantado o atrasado respecto de ella.
 *
 * El archivo queda en backups/ (ignorado por git) y contiene datos
 * personales de talmidim: no compartirlo ni subirlo a ningún lado.
 */
import { PrismaClient } from '@prisma/client'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

type TablaInfo = { table_name: string }

async function main() {
  const tablas = await prisma.$queryRaw<TablaInfo[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '\\_prisma%'
    ORDER BY table_name
  `

  if (tablas.length === 0) {
    throw new Error('No se encontraron tablas en el schema public')
  }

  const contenido: Record<string, unknown[]> = {}

  for (const { table_name } of tablas) {
    // table_name viene de information_schema, no de input del usuario.
    const filas = await prisma.$queryRawUnsafe<unknown[]>(
      `SELECT * FROM "${table_name}"`
    )
    contenido[table_name] = filas
  }

  const backup = {
    generadoEn: new Date().toISOString(),
    tablas: contenido,
  }

  const dir = path.join(process.cwd(), 'backups')
  await mkdir(dir, { recursive: true })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const archivo = path.join(dir, `backup-${stamp}.json`)

  // BigInt no es serializable por defecto.
  const json = JSON.stringify(
    backup,
    (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
    2
  )
  await writeFile(archivo, json)

  console.log('Backup escrito en:', archivo)
  console.log('\nFilas por tabla:')
  for (const [tabla, filas] of Object.entries(contenido)) {
    console.log(`  ${tabla.padEnd(24)} ${filas.length}`)
  }
}

main()
  .catch((error) => {
    console.error('Error en el backup:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
