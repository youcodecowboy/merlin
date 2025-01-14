import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

const DEFAULT_STORAGE_BINS = [
  {
    name: 'ZONE1-A',
    type: 'STORAGE',
    status: 'ACTIVE',
    zone: 'ZONE1',
    capacity: 10,
    currentCount: 0,
    qrCode: 'STORAGE-Z1A'
  },
  {
    name: 'ZONE1-B',
    type: 'STORAGE',
    status: 'ACTIVE',
    zone: 'ZONE1',
    capacity: 10,
    currentCount: 0,
    qrCode: 'STORAGE-Z1B'
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if storage bins already exist
    const existingBins = await prisma.bin.findMany({
      where: {
        type: 'STORAGE'
      }
    });

    // If bins exist and have items, return error
    if (existingBins.length > 0) {
      // Delete existing bins
      await prisma.bin.deleteMany({
        where: {
          type: 'STORAGE'
        }
      });
    }

    // Create default storage bins
    const createdBins = await Promise.all(
      DEFAULT_STORAGE_BINS.map(bin => 
        prisma.bin.create({
          data: bin
        })
      )
    );

    return res.status(200).json({ success: true, bins: createdBins });
  } catch (error) {
    console.error('Error setting up storage bins:', error);
    return res.status(500).json({ error: 'Failed to setup storage bins' });
  }
} 