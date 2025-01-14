import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const patternRequests = await prisma.patternRequest.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform the data to match the frontend interface
      const transformedPatterns = patternRequests.map(pattern => ({
        id: pattern.id,
        sku: pattern.sku,
        quantity: pattern.quantity,
        requestedDate: pattern.createdAt.toISOString(),
        status: pattern.status,
        priority: getPriority(pattern.createdAt), // Calculate priority based on age
        notes: `Pattern request for ${pattern.quantity} units`
      }));

      return res.status(200).json(transformedPatterns);
    } catch (error) {
      console.error('[PATTERNS_API] Error fetching patterns:', error);
      return res.status(500).json({ error: 'Failed to fetch pattern requests' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { id, action } = req.body;

      if (!id || !action) {
        return res.status(400).json({ error: 'Missing required fields: id and action' });
      }

      if (action === 'complete') {
        const updatedPattern = await prisma.patternRequest.update({
          where: { id },
          data: { status: 'COMPLETED' }
        });

        return res.status(200).json(updatedPattern);
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
      console.error('[PATTERNS_API] Error updating pattern:', error);
      return res.status(500).json({ error: 'Failed to update pattern request' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// Helper function to calculate priority based on age
function getPriority(createdAt: Date): 'high' | 'medium' | 'low' {
  const daysSinceCreated = Math.floor(
    (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCreated >= 7) return 'high';
  if (daysSinceCreated >= 3) return 'medium';
  return 'low';
} 