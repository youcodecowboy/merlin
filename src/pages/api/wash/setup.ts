//# sourceMappingURL=
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

// Default wash bins configuration
const DEFAULT_WASH_BINS = [
  {
    qrCode: 'WASH-IND-001',
    name: 'INDIGO',
    type: 'WASH',
    zone: 'WASH',
    capacity: 50,
    currentCount: 0
  },
  {
    qrCode: 'WASH-STA-001',
    name: 'STARDUST',
    type: 'WASH',
    zone: 'WASH',
    capacity: 50,
    currentCount: 0
  },
  {
    qrCode: 'WASH-ONX-001',
    name: 'ONYX',
    type: 'WASH',
    zone: 'WASH',
    capacity: 50,
    currentCount: 0
  },
  {
    qrCode: 'WASH-JAG-001',
    name: 'JAGGER',
    type: 'WASH',
    zone: 'WASH',
    capacity: 50,
    currentCount: 0
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if we should force recreate the bins
    const force = req.query.force === 'true';

    // Check if wash bins already exist
    const existingBins = await prisma.bin.findMany({
      where: {
        type: 'WASH'
      },
      include: {
        assignedItems: true
      }
    });

    if (existingBins.length > 0) {
      if (!force) {
        return res.status(400).json({ 
          error: 'Wash bins already exist',
          bins: existingBins
        });
      }

      // Delete existing bins if they have no items
      for (const bin of existingBins) {
        if (bin.assignedItems.length > 0) {
          return res.status(400).json({
            error: 'Cannot delete bins with assigned items',
            bins: existingBins
          });
        }
      }

      // Delete all existing wash bins
      await prisma.bin.deleteMany({
        where: {
          type: 'WASH'
        }
      });
    }

    // Create all wash bins
    const createdBins = await Promise.all(
      DEFAULT_WASH_BINS.map(bin => 
        prisma.bin.create({
          data: bin
        })
      )
    );

    return res.status(200).json({
      message: 'Default wash bins created successfully',
      bins: createdBins
    });

  } catch (error) {
    // Handle Prisma errors
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: error.message
      });
    }
    // Handle other errors
    return res.status(500).json({ 
      error: 'An unexpected error occurred'
    });
  }
} 