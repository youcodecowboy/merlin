import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { WashCode } from '../../../lib/sku';
import { createProductionRequest, OrderItem } from '../../../lib/production-request';

function generateUniqueEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `test-${timestamp}-${random}@example.com`;
}

const TEST_SKU = {
  style: 'ST',
  waist: 32,
  shape: 'X',
  length: 32,
  wash: 'IND' as WashCode,
  quantity: 1
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: generateUniqueEmail()
      }
    });

    const createdOrders = [];
    const orderItems: OrderItem[] = [];

    // Create 3 orders with the same SKU
    for (let i = 0; i < 3; i++) {
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          status: 'PENDING',
          targetStyle: TEST_SKU.style,
          targetWaist: TEST_SKU.waist,
          targetShape: TEST_SKU.shape,
          targetLength: TEST_SKU.length,
          targetWash: TEST_SKU.wash,
          buttonColor: 'WHITE',
          hemType: 'STANDARD'
        }
      });

      const orderItem: OrderItem = {
        orderId: order.id,
        customerName: customer.name,
        targetSku: {
          style: order.targetStyle,
          waist: order.targetWaist,
          shape: order.targetShape,
          length: order.targetLength,
          wash: order.targetWash as WashCode
        },
        quantity: TEST_SKU.quantity,
        orderDate: order.createdAt,
        status: order.status
      };

      orderItems.push(orderItem);
      createdOrders.push({
        id: order.id,
        sku: `${order.targetStyle}-${order.targetWaist}-${order.targetShape}-${order.targetLength}-${order.targetWash}`,
        status: order.status
      });
    }

    // Create production request(s) for all orders
    await createProductionRequest(orderItems);

    // Get all production requests
    const productionRequests = await prisma.productionRequest.findMany({
      include: {
        waitlist: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    const simplifiedRequests = productionRequests.map(pr => ({
      id: pr.id,
      sku: `${pr.style}-${pr.waist}-${pr.shape}-${pr.length}-${pr.wash}`,
      quantity: pr.quantity,
      status: pr.status,
      waitlistCount: pr.waitlist.length
    }));

    return res.status(200).json({
      success: true,
      orders: createdOrders,
      productionRequests: simplifiedRequests
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate orders',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 