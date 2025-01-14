import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid bin ID' });
  }

  if (req.method === 'DELETE') {
    try {
      // Check if the bin exists and has no items
      const bin = await prisma.bin.findUnique({
        where: { id },
        include: {
          assignedItems: true
        }
      });

      if (!bin) {
        return res.status(404).json({ error: 'Bin not found' });
      }

      if (bin.assignedItems.length > 0) {
        return res.status(400).json({ error: 'Cannot delete bin with assigned items' });
      }

      // Delete the bin
      await prisma.bin.delete({
        where: { id }
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[STORAGE_API] Failed to delete bin:', error);
      return res.status(500).json({ error: String(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default handler; 