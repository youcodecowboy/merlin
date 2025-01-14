import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all items in the LAUNDRY location
    const items = await prisma.item.findMany({
      where: {
        location: 'LAUNDRY'
      },
      select: {
        id: true,
        style: true,
        status1: true,
        status2: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      items
    });

  } catch (error) {
    console.error('[WASH_API] Failed to fetch laundry items:', error);
    return res.status(500).json({ error: String(error) });
  }
} 