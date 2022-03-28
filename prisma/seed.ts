import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  const email = 'jannik@miny.app'

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  })

  const dateFromSeedUser = await prisma.date.findFirst({
    where: {
      user: {
        email,
      },
    },
  })

  if (dateFromSeedUser) {
    await prisma.date
      .delete({ where: { id: dateFromSeedUser.id } })
      .catch(() => {
        // no worries if it doesn't exist yet
      })
  }

  const hashedPassword = await bcrypt.hash('minyiscool', 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Jannik',
      slug: 'jannik',
    },
  })

  await prisma.date.create({
    data: {
      userId: user.id,
      date: new Date().toISOString(),
      startTime: '10:00',
    },
  })

  console.log(`Database has been seeded. 🌱`)
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })