import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid bin ID' });
  }

  try {
    // Get the bin and its items
    const bin = await prisma.bin.findUnique({
      where: { id },
      include: {
        assignedItems: true
      }
    });

    if (!bin) {
      return res.status(404).json({ error: 'Bin not found' });
    }

    if (bin.type !== 'WASH') {
      return res.status(400).json({ error: 'Not a wash bin' });
    }

    // Update all items in the bin to be in laundry
    await prisma.item.updateMany({
      where: {
        id: {
          in: bin.assignedItems.map(item => item.id)
        }
      },
      data: {
        location: 'LAUNDRY',
        assignedBinId: null
      }
    });

    // Reset bin count
    await prisma.bin.update({
      where: { id },
      data: {
        currentCount: 0
      }
    });

    // Record scan events for all items
    await Promise.all(
      bin.assignedItems.map(item =>
        prisma.scanEvent.create({
          data: {
            itemId: item.id,
            type: 'WASH_BIN_SCAN_OUT',
            location: 'LAUNDRY',
            success: true,
            metadata: {
              previousLocation: bin.qrCode,
              newLocation: 'LAUNDRY',
              washBin: bin.qrCode
            }
          }
        })
      )
    );

    return res.status(200).json({
      message: 'Bin scanned out successfully',
      itemCount: bin.assignedItems.length
    });

  } catch (error) {
    console.error('[WASH_API] Failed to scan out bin:', error);
    return res.status(500).json({ error: String(error) });
  }
} 