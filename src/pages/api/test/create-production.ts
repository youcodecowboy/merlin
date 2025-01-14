import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

const testRequests = [
  {
    style: 'ST',
    waist: 32,
    length: 36,
    shape: 'X',
    wash: 'RAW',
    quantity: 3
  },
  {
    style: 'ST',
    waist: 34,
    length: 36,
    shape: 'H',
    wash: 'RAW',
    quantity: 4
  },
  {
    style: 'ST',
    waist: 36,
    length: 36,
    shape: 'X',
    wash: 'BRW',
    quantity: 3
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[TEST_API] Creating test production requests...');
    
    const createdRequests = await Promise.all(
      testRequests.map(async (request) => {
        return prisma.productionRequest.create({
          data: {
            ...request,
            status: 'PENDING'
          }
        });
      })
    );

    console.log('[TEST_API] Created requests:', createdRequests);
    return res.status(200).json({ 
      message: 'Test production requests created successfully',
      requests: createdRequests 
    });
  } catch (error) {
    console.error('[TEST_API] Error creating test requests:', error);
    return res.status(500).json({ error: 'Failed to create test requests' });
  }
} 