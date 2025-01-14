import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type BinWithItems = Prisma.BinGetPayload<{
  include: {
    Item: {
      select: {
        id: true;
        qrCode: true;
        style: true;
        waist: true;
        length: true;
        shape: true;
        wash: true;
        status1: true;
        status2: true;
        createdAt: true;
      }
    }
  }
}>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const bins = await prisma.bin.findMany({
        include: {
          Item: {
            select: {
              id: true,
              qrCode: true,
              style: true,
              waist: true,
              length: true,
              shape: true,
              wash: true,
              status1: true,
              status2: true,
              createdAt: true
            }
          }
        }
      });
      
      // Group bins by zone
      const binsByZone = bins.reduce<Record<string, BinWithItems[]>>((acc, bin) => {
        const zone = bin.zone || 'UNASSIGNED';
        if (!acc[zone]) {
          acc[zone] = [];
        }
        acc[zone].push(bin);
        return acc;
      }, {});

      return res.status(200).json(binsByZone);
    } catch (error) {
      console.error('Error fetching bins:', error);
      return res.status(500).json({ error: 'Failed to fetch bins' });
    }
  }

  if (req.method === 'POST') {
    const { type, name, status, zone = 'ZONE1', capacity = 10, currentCount = 0, qrCode } = req.body;

    // Validate required fields
    if (!type || !name || !status) {
      return res.status(400).json({ error: 'Missing required fields: type, name, status' });
    }

    try {
      const bin = await prisma.bin.create({
        data: {
          type,
          name,
          status,
          zone,
          capacity,
          currentCount,
          qrCode: qrCode || `${type}-${name}`
        }
      });

      return res.status(201).json(bin);
    } catch (error) {
      console.error('Error creating bin:', error);
      return res.status(500).json({ error: 'Failed to create bin' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 