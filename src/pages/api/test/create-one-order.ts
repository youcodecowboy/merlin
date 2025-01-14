import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../db';
import { WashCode } from '../../../lib/sku';
import { createProductionRequest, OrderItem } from '../../../lib/production-request';

function generateUniqueEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-${timestamp}-${random}@example.com`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Early return for non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create test customer with unique email
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: generateUniqueEmail()
      }
    });

    // Create test order
    const order = await prisma.$queryRaw`
      INSERT INTO "public"."Order" (
        "id",
        "customerId",
        "status1",
        "status2",
        "targetStyle",
        "targetWaist",
        "targetShape",
        "targetLength",
        "targetWash",
        "buttonColor",
        "hemType",
        "location",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${crypto.randomUUID()},
        ${customer.id},
        'CREATED',
        'PENDING',
        ${req.body.targetStyle || 'ST'},
        ${req.body.targetWaist || 32},
        ${req.body.targetShape || 'X'},
        ${req.body.targetLength || 32},
        ${req.body.targetWash || 'IND'},
        'WHITE',
        'ORL',
        'PENDING',
        NOW(),
        NOW()
      ) RETURNING *
    ` as unknown as { 
      id: string;
      targetStyle: string;
      targetWaist: number;
      targetShape: string;
      targetLength: number;
      targetWash: string;
      status1: string;
      status2: string;
    }[];

    const createdOrder = order[0];

    // Create production request directly
    const productionRequest = await prisma.productionRequest.create({
      data: {
        style: createdOrder.targetStyle,
        waist: createdOrder.targetWaist,
        shape: createdOrder.targetShape,
        length: 36,
        wash: createdOrder.targetWash === 'IND' || createdOrder.targetWash === 'STA' ? 'RAW' : 'BRW',
        quantity: 1,
        status: 'PENDING',
        updatedAt: new Date(),
        waitlist: {
          create: [{
            orderId: createdOrder.id,
            position: 1
          }]
        }
      }
    });

    // Send success response
    return res.status(200).json({
      success: true,
      order: {
        id: createdOrder.id,
        sku: `${createdOrder.targetStyle}-${createdOrder.targetWaist}-${createdOrder.targetShape}-${createdOrder.targetLength}-${createdOrder.targetWash}`,
        status1: createdOrder.status1,
        status2: createdOrder.status2
      },
      productionRequest: {
        id: productionRequest.id,
        sku: `${productionRequest.style}-${productionRequest.waist}-${productionRequest.shape}-${productionRequest.length}-${productionRequest.wash}`,
        quantity: productionRequest.quantity,
        status: productionRequest.status,
        waitlistCount: 1
      }
    });

  } catch (error) {
    // Send error response without logging the error
    return res.status(500).json({
      success: false,
      error: 'Failed to create test order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 