import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const talmidim = [
  { nombre: 'Ailin', apellido: 'Kassir' },
  { nombre: 'Eitan', apellido: 'Moscovich' },
  { nombre: 'Ian', apellido: 'Pelzmajer' },
  { nombre: 'Juana', apellido: 'Balagur' },
  { nombre: 'Juli', apellido: 'Isaak' },
  { nombre: 'Lelu', apellido: 'Golberg' },
  { nombre: 'Lola', apellido: 'Swartz' },
  { nombre: 'Luka', apellido: 'Navarro' },
  { nombre: 'Manu', apellido: 'Kaplan' },
  { nombre: 'Nico', apellido: 'Schwartz' },
  { nombre: 'Sebastian', apellido: 'Zymmerman' },
  { nombre: 'Shirly', apellido: 'Goldberg' },
  { nombre: 'Sofia', apellido: 'Babor' },
  { nombre: 'Solana', apellido: 'Chab' },
  { nombre: 'Solana', apellido: 'Szwarcberg' },
  { nombre: 'Tali', apellido: 'Charas' },
  { nombre: 'Tati', apellido: 'Skliar' },
  { nombre: 'Tatiana', apellido: 'Said' },
  { nombre: 'Thiago', apellido: 'Binder' },
  { nombre: 'Thiago', apellido: 'Elman' },
  { nombre: 'Tobias', apellido: 'Choue' },
  { nombre: 'Tomas', apellido: 'Bembenaste' },
]

// Feriados argentinos 2025
const feriadosArgentinos2025 = [
  { fecha: '2025-01-01', nombre: 'Año Nuevo' },
  { fecha: '2025-03-03', nombre: 'Carnaval' },
  { fecha: '2025-03-04', nombre: 'Carnaval' },
  { fecha: '2025-03-24', nombre: 'Día Nacional de la Memoria' },
  { fecha: '2025-04-02', nombre: 'Día del Veterano y de los Caídos en Malvinas' },
  { fecha: '2025-04-18', nombre: 'Viernes Santo' },
  { fecha: '2025-05-01', nombre: 'Día del Trabajador' },
  { fecha: '2025-05-25', nombre: 'Día de la Revolución de Mayo' },
  { fecha: '2025-06-16', nombre: 'Paso a la Inmortalidad del Gral. Güemes' },
  { fecha: '2025-06-20', nombre: 'Paso a la Inmortalidad del Gral. Belgrano' },
  { fecha: '2025-07-09', nombre: 'Día de la Independencia' },
  { fecha: '2025-08-18', nombre: 'Paso a la Inmortalidad del Gral. San Martín' },
  { fecha: '2025-10-12', nombre: 'Día del Respeto a la Diversidad Cultural' },
  { fecha: '2025-11-20', nombre: 'Día de la Soberanía Nacional' },
  { fecha: '2025-12-08', nombre: 'Inmaculada Concepción de María' },
  { fecha: '2025-12-25', nombre: 'Navidad' },
]

// Feriados judíos 2025 (fechas aproximadas basadas en calendario hebreo)
const feriadosJudios2025 = [
  { fecha: '2025-03-14', nombre: 'Purim' },
  { fecha: '2025-04-13', nombre: 'Pesaj (inicio)' },
  { fecha: '2025-04-14', nombre: 'Pesaj' },
  { fecha: '2025-04-15', nombre: 'Pesaj' },
  { fecha: '2025-04-16', nombre: 'Pesaj' },
  { fecha: '2025-04-17', nombre: 'Pesaj' },
  { fecha: '2025-04-18', nombre: 'Pesaj' },
  { fecha: '2025-04-19', nombre: 'Pesaj' },
  { fecha: '2025-04-20', nombre: 'Pesaj (fin)' },
  { fecha: '2025-05-02', nombre: 'Iom HaShoá' },
  { fecha: '2025-05-09', nombre: 'Iom HaZikarón' },
  { fecha: '2025-05-10', nombre: 'Iom HaAtzmaut' },
  { fecha: '2025-05-26', nombre: 'Lag BaOmer' },
  { fecha: '2025-06-02', nombre: 'Shavuot' },
  { fecha: '2025-06-03', nombre: 'Shavuot' },
  { fecha: '2025-08-03', nombre: 'Tishá BeAv' },
  { fecha: '2025-09-23', nombre: 'Rosh Hashaná' },
  { fecha: '2025-09-24', nombre: 'Rosh Hashaná' },
  { fecha: '2025-10-02', nombre: 'Iom Kipur' },
  { fecha: '2025-10-07', nombre: 'Sucot (inicio)' },
  { fecha: '2025-10-08', nombre: 'Sucot' },
  { fecha: '2025-10-09', nombre: 'Sucot' },
  { fecha: '2025-10-10', nombre: 'Sucot' },
  { fecha: '2025-10-11', nombre: 'Sucot' },
  { fecha: '2025-10-12', nombre: 'Sucot' },
  { fecha: '2025-10-13', nombre: 'Sucot' },
  { fecha: '2025-10-14', nombre: 'Sheminí Atzeret' },
  { fecha: '2025-10-15', nombre: 'Simjat Torá' },
  { fecha: '2025-12-15', nombre: 'Janucá (inicio)' },
  { fecha: '2025-12-16', nombre: 'Janucá' },
  { fecha: '2025-12-17', nombre: 'Janucá' },
  { fecha: '2025-12-18', nombre: 'Janucá' },
  { fecha: '2025-12-19', nombre: 'Janucá' },
  { fecha: '2025-12-20', nombre: 'Janucá' },
  { fecha: '2025-12-21', nombre: 'Janucá' },
  { fecha: '2025-12-22', nombre: 'Janucá (fin)' },
]

// Feriados 2026 (parcial para el año siguiente)
const feriadosArgentinos2026 = [
  { fecha: '2026-01-01', nombre: 'Año Nuevo' },
  { fecha: '2026-02-16', nombre: 'Carnaval' },
  { fecha: '2026-02-17', nombre: 'Carnaval' },
  { fecha: '2026-03-24', nombre: 'Día Nacional de la Memoria' },
  { fecha: '2026-04-02', nombre: 'Día del Veterano y de los Caídos en Malvinas' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajador' },
  { fecha: '2026-05-25', nombre: 'Día de la Revolución de Mayo' },
  { fecha: '2026-06-15', nombre: 'Paso a la Inmortalidad del Gral. Güemes' },
  { fecha: '2026-06-20', nombre: 'Paso a la Inmortalidad del Gral. Belgrano' },
  { fecha: '2026-07-09', nombre: 'Día de la Independencia' },
  { fecha: '2026-08-17', nombre: 'Paso a la Inmortalidad del Gral. San Martín' },
  { fecha: '2026-10-12', nombre: 'Día del Respeto a la Diversidad Cultural' },
  { fecha: '2026-11-23', nombre: 'Día de la Soberanía Nacional' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción de María' },
  { fecha: '2026-12-25', nombre: 'Navidad' },
]

const feriadosJudios2026 = [
  { fecha: '2026-03-03', nombre: 'Purim' },
  { fecha: '2026-04-02', nombre: 'Pesaj (inicio)' },
  { fecha: '2026-04-03', nombre: 'Pesaj' },
  { fecha: '2026-04-04', nombre: 'Pesaj' },
  { fecha: '2026-04-05', nombre: 'Pesaj' },
  { fecha: '2026-04-06', nombre: 'Pesaj' },
  { fecha: '2026-04-07', nombre: 'Pesaj' },
  { fecha: '2026-04-08', nombre: 'Pesaj' },
  { fecha: '2026-04-09', nombre: 'Pesaj (fin)' },
  { fecha: '2026-05-22', nombre: 'Shavuot' },
  { fecha: '2026-05-23', nombre: 'Shavuot' },
  { fecha: '2026-09-12', nombre: 'Rosh Hashaná' },
  { fecha: '2026-09-13', nombre: 'Rosh Hashaná' },
  { fecha: '2026-09-21', nombre: 'Iom Kipur' },
  { fecha: '2026-09-26', nombre: 'Sucot (inicio)' },
  { fecha: '2026-10-03', nombre: 'Sheminí Atzeret' },
  { fecha: '2026-10-04', nombre: 'Simjat Torá' },
  { fecha: '2026-12-05', nombre: 'Janucá (inicio)' },
  { fecha: '2026-12-12', nombre: 'Janucá (fin)' },
]

async function main() {
  console.log('Seeding database...')

  // Crear talmidim
  for (const talmid of talmidim) {
    await prisma.talmid.upsert({
      where: { id: `${talmid.nombre.toLowerCase()}-${talmid.apellido.toLowerCase()}` },
      update: {},
      create: {
        id: `${talmid.nombre.toLowerCase()}-${talmid.apellido.toLowerCase()}`,
        nombre: talmid.nombre,
        apellido: talmid.apellido,
      },
    })
  }
  console.log(`Created ${talmidim.length} talmidim`)

  // Crear feriados argentinos 2025
  for (const feriado of feriadosArgentinos2025) {
    await prisma.feriado.upsert({
      where: { fecha: new Date(feriado.fecha) },
      update: {},
      create: {
        fecha: new Date(feriado.fecha),
        nombre: feriado.nombre,
        tipo: 'argentino',
      },
    })
  }

  // Crear feriados judíos 2025
  for (const feriado of feriadosJudios2025) {
    await prisma.feriado.upsert({
      where: { fecha: new Date(feriado.fecha) },
      update: {},
      create: {
        fecha: new Date(feriado.fecha),
        nombre: feriado.nombre,
        tipo: 'judio',
      },
    })
  }

  // Crear feriados 2026
  for (const feriado of feriadosArgentinos2026) {
    await prisma.feriado.upsert({
      where: { fecha: new Date(feriado.fecha) },
      update: {},
      create: {
        fecha: new Date(feriado.fecha),
        nombre: feriado.nombre,
        tipo: 'argentino',
      },
    })
  }

  for (const feriado of feriadosJudios2026) {
    await prisma.feriado.upsert({
      where: { fecha: new Date(feriado.fecha) },
      update: {},
      create: {
        fecha: new Date(feriado.fecha),
        nombre: feriado.nombre,
        tipo: 'judio',
      },
    })
  }

  console.log('Created feriados 2025 and 2026')

  // Crear password hasheado por defecto (cambiar en producción)
  const defaultPassword = await bcrypt.hash('majon2025', 10)
  await prisma.config.upsert({
    where: { clave: 'password_hash' },
    update: {},
    create: {
      clave: 'password_hash',
      valor: defaultPassword,
    },
  })
  console.log('Created default password config (password: majon2025)')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
