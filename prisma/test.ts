import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing bin queries...')
    
    // First, let's see what bins we have
    const allBins = await prisma.bin.findMany()
    console.log('All bins:', allBins)
    
    // Try different query approaches
    console.log('\nTesting different queries:')
    
    // Approach 1: Simple comparison
    const bins1 = await prisma.bin.findMany({
      where: {
        type: 'STORAGE'
      }
    })
    console.log('\nApproach 1 - Just type:', bins1)
    
    // Approach 2: Raw query to compare fields
    const bins2 = await prisma.$queryRaw`
      SELECT * FROM "Bin"
      WHERE type = 'STORAGE'
      AND "currentCount" < capacity
      ORDER BY "currentCount" ASC;
    `
    console.log('\nApproach 2 - Raw SQL:', bins2)

    // Approach 3: Using Prisma's native field comparison
    const bins3 = await prisma.bin.findMany({
      where: {
        type: 'STORAGE',
        currentCount: {
          lt: Prisma.sql`"capacity"`
        }
      },
      orderBy: {
        currentCount: 'asc'
      }
    })
    console.log('\nApproach 3 - Prisma native:', bins3)

  } catch (error) {
    console.error('Test error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 