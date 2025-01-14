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
    // Fetch all wash bins with their assigned items
    const bins = await prisma.bin.findMany({
      where: {
        type: 'WASH'
      },
      include: {
        assignedItems: {
          select: {
            id: true,
            style: true,
            status1: true,
            status2: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Add descriptions based on bin name
    const binsWithDescriptions = bins.map(bin => {
      const description = getWashDescription(bin.qrCode.split('-')[1]); // Extract wash type from QR code
      return {
        id: bin.id,
        name: bin.qrCode.split('-')[1], // Use wash type from QR code as name
        type: bin.type,
        capacity: bin.capacity,
        currentCount: bin.currentCount,
        description,
        assignedItems: bin.assignedItems.map(item => ({
          id: item.id,
          sku: item.style, // Use style as SKU
          status1: item.status1,
          status2: item.status2,
          createdAt: item.createdAt
        }))
      };
    });

    return res.status(200).json({
      bins: binsWithDescriptions
    });

  } catch (error) {
    console.error('[WASH_API] Failed to fetch wash bins:', error);
    return res.status(500).json({ error: String(error) });
  }
}

function getWashDescription(washType: string): string {
  switch (washType.toUpperCase()) {
    case 'IND':
      return 'Medium wash treatment';
    case 'STA':
      return 'Light wash treatment';
    case 'ONX':
      return 'Dark wash treatment';
    case 'JAG':
      return 'Special wash treatment';
    default:
      return 'Wash treatment';
  }
} 