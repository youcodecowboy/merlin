import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid production request ID' });
  }

  if (req.method === 'PATCH') {
    try {
      const { quantity } = req.body;

      if (typeof quantity !== 'number') {
        return res.status(400).json({ error: 'Invalid quantity' });
      }

      const updatedRequest = await prisma.productionRequest.update({
        where: { id },
        data: { quantity }
      });

      return res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('[PRODUCTION_API] Failed to update production request:', error);
      return res.status(500).json({ error: String(error) });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default handler; 