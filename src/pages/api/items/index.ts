import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const { search, status1, status2, location } = req.query

    // Build filter conditions
    const where: any = {}
    
    if (search) {
      where.OR = [
        { qrCode: { contains: search as string, mode: 'insensitive' } },
        { style: { contains: search as string, mode: 'insensitive' } },
        { shape: { contains: search as string, mode: 'insensitive' } },
        { wash: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (status1) {
      where.status1 = status1
    }

    if (status2) {
      where.status2 = status2
    }

    if (location) {
      where.location = location
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return res.status(200).json(items)
  } catch (error) {
    console.error('[ITEMS_API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch items' })
  }
} 