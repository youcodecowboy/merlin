import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TEST] Received request:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[TEST] Creating test customer...');
    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com'
      }
    });
    console.log('[TEST] Created customer:', customer);

    console.log('[TEST] Creating test order...');
    // Create test order
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        targetStyle: 'ST',
        targetWaist: 32,
        targetShape: 'X',
        targetLength: 32,
        targetWash: 'IND',
        buttonColor: 'WHITE',
        hemType: 'STANDARD'
      }
    });
    console.log('[TEST] Created order:', order);

    const response = {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      order: {
        id: order.id,
        sku: `${order.targetStyle}-${order.targetWaist}-${order.targetShape}-${order.targetLength}-${order.targetWash}`,
        status: order.status
      }
    };
    console.log('[TEST] Sending response:', response);

    return res.status(200).json(response);

  } catch (error) {
    console.error('[TEST] Error:', error);
    const errorResponse = {
      success: false,
      error: 'Failed to create test data',
      details: error instanceof Error ? error.message : String(error)
    };
    console.error('[TEST] Error response:', errorResponse);
    return res.status(500).json(errorResponse);
  }
} 