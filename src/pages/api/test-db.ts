import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  try {
    // Get initial count
    const initialCount = await prisma.item.count()
    console.log('Initial count:', initialCount)

    // Create test items
    console.log('Creating first test item...')
    const item1 = await prisma.item.create({
      data: {
        qrCode: `TEST001_${Date.now()}`, // Make unique
        style: 'ST',
        waist: 32,
        length: 32,
        shape: 'X',
        wash: 'RAW',
        status1: 'UNCOMMITTED',
        status2: 'PRODUCTION'
      }
    })
    console.log('Created item 1:', item1)

    console.log('Creating second test item...')
    const item2 = await prisma.item.create({
      data: {
        qrCode: `TEST002_${Date.now()}`, // Make unique
        style: 'ST',
        waist: 34,
        length: 34,
        shape: 'S',
        wash: 'DARK',
        status1: 'UNCOMMITTED',
        status2: 'PRODUCTION'
      }
    })
    console.log('Created item 2:', item2)

    // Get final count
    const finalCount = await prisma.item.count()
    console.log('Final count:', finalCount)
    
    // Send response
    res.status(200).json({
      ok: true,
      message: 'Test items created successfully',
      initialCount,
      finalCount,
      items: [item1, item2]
    })
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorDetails: error
    })
  }
} 