import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../db';
import { WashCode } from '../../../lib/sku';
import { createProductionRequest, findMatchingProductionRequest, OrderItem } from '../../../lib/production-request';

async function createTestCustomer() {
  return prisma.customer.create({
    data: {
      name: 'Test Customer',
      email: 'test@example.com'
    }
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[TEST] Starting test scenarios...');
    
    const customer = await createTestCustomer();
    console.log('[TEST] Created test customer:', customer.id);

    // Scenario 1: Create a new production request
    console.log('[TEST] Starting Scenario 1: Create new production request');
    const order1 = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        targetStyle: 'ST',
        targetWaist: 32,
        targetShape: 'X',
        targetLength: 32,
        targetWash: 'IND',
        buttonColor: 'SILVER',
        hemType: 'STANDARD'
      },
      include: {
        customer: true
      }
    });
    console.log('[TEST] Created order 1:', order1.id);

    const orderItem1: OrderItem = {
      orderId: order1.id,
      customerName: customer.name,
      targetSku: {
        style: order1.targetStyle,
        waist: order1.targetWaist,
        shape: order1.targetShape,
        length: order1.targetLength,
        wash: order1.targetWash as WashCode
      },
      quantity: 1,
      orderDate: order1.createdAt,
      status: order1.status
    };

    // Create production request for order1
    await createProductionRequest([orderItem1]);
    console.log('[TEST] Created production request for order 1');

    // Scenario 2: Create a production request with RAW wash
    console.log('[TEST] Starting Scenario 2: Test universal wash matching');
    const productionRequest2 = await prisma.productionRequest.create({
      data: {
        style: 'ST',
        waist: 30,
        shape: 'H',
        length: 36,
        wash: 'RAW',
        quantity: 8,
        status: 'PENDING'
      }
    });
    console.log('[TEST] Created universal wash production request:', productionRequest2.id);

    // Create an order that should match the RAW production request
    const order2 = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        targetStyle: 'ST',
        targetWaist: 30,
        targetShape: 'H',
        targetLength: 34,
        targetWash: 'STA',
        buttonColor: 'SILVER',
        hemType: 'STANDARD'
      },
      include: {
        customer: true
      }
    });
    console.log('[TEST] Created order 2:', order2.id);

    const orderItem2: OrderItem = {
      orderId: order2.id,
      customerName: customer.name,
      targetSku: {
        style: order2.targetStyle,
        waist: order2.targetWaist,
        shape: order2.targetShape,
        length: order2.targetLength,
        wash: order2.targetWash as WashCode
      },
      quantity: 1,
      orderDate: order2.createdAt,
      status: order2.status
    };

    // Try to find matching production request for order2
    const matchingRequest2 = await findMatchingProductionRequest(orderItem2);
    console.log('[TEST] Matching request for order 2:', matchingRequest2?.id);
    
    if (matchingRequest2) {
      // Add to waitlist
      const waitlistEntry2 = await prisma.waitlist.create({
        data: {
          orderId: order2.id,
          productionRequestId: matchingRequest2.id,
          position: (matchingRequest2.waitlist?.length || 0) + 1
        }
      });
      console.log('[TEST] Added order 2 to waitlist:', waitlistEntry2.id);

      // Update order status
      await prisma.order.update({
        where: { id: order2.id },
        data: { status: 'ASSIGNED' }
      });
      console.log('[TEST] Updated order 2 status to ASSIGNED');
    }

    // Scenario 3: Create an order that matches an existing production request
    console.log('[TEST] Starting Scenario 3: Match existing production request');
    const order3 = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        targetStyle: 'ST',
        targetWaist: 32,
        targetShape: 'X',
        targetLength: 32,
        targetWash: 'IND',
        buttonColor: 'SILVER',
        hemType: 'STANDARD'
      },
      include: {
        customer: true
      }
    });
    console.log('[TEST] Created order 3:', order3.id);

    const orderItem3: OrderItem = {
      orderId: order3.id,
      customerName: customer.name,
      targetSku: {
        style: order3.targetStyle,
        waist: order3.targetWaist,
        shape: order3.targetShape,
        length: order3.targetLength,
        wash: order3.targetWash as WashCode
      },
      quantity: 1,
      orderDate: order3.createdAt,
      status: order3.status
    };

    // Try to find matching production request for order3
    const matchingRequest3 = await findMatchingProductionRequest(orderItem3);
    console.log('[TEST] Matching request for order 3:', matchingRequest3?.id);

    if (matchingRequest3) {
      // Add to waitlist
      const waitlistEntry3 = await prisma.waitlist.create({
        data: {
          orderId: order3.id,
          productionRequestId: matchingRequest3.id,
          position: (matchingRequest3.waitlist?.length || 0) + 1
        }
      });
      console.log('[TEST] Added order 3 to waitlist:', waitlistEntry3.id);

      // Update order status
      await prisma.order.update({
        where: { id: order3.id },
        data: { status: 'ASSIGNED' }
      });
      console.log('[TEST] Updated order 3 status to ASSIGNED');
    }

    // Get final state of all entities
    const finalOrders = await prisma.order.findMany({
      where: {
        id: {
          in: [order1.id, order2.id, order3.id]
        }
      },
      include: {
        customer: true
      }
    });

    const finalProductionRequests = await prisma.productionRequest.findMany({
      include: {
        waitlist: true
      }
    });

    return res.status(200).json({
      message: 'Test scenarios completed',
      results: {
        scenario1: {
          order: finalOrders.find(o => o.id === order1.id),
          description: 'Created new production request'
        },
        scenario2: {
          order: finalOrders.find(o => o.id === order2.id),
          matchingRequest: matchingRequest2,
          description: matchingRequest2 ? 'Found universal match (RAW)' : 'No match found'
        },
        scenario3: {
          order: finalOrders.find(o => o.id === order3.id),
          matchingRequest: matchingRequest3,
          description: matchingRequest3 ? 'Found existing production request' : 'No match found'
        },
        finalState: {
          orders: finalOrders,
          productionRequests: finalProductionRequests
        }
      }
    });

  } catch (error) {
    console.error('[TEST] Error running test scenarios:', error);
    return res.status(500).json({ error: 'Failed to run test scenarios', details: error });
  }
} 