import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../db';
import { createProductionRequest, findMatchingProductionRequest, OrderItem } from '../../../lib/production-request';
import { STATUS, WashCode } from '../../../lib/sku';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all pending orders
    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        customer: true
      }
    });

    // Transform orders into OrderItems
    const orderItems: OrderItem[] = pendingOrders.map(order => ({
      orderId: order.id,
      customerName: order.customer?.name || 'Unknown Customer',
      targetSku: {
        style: order.targetStyle,
        waist: order.targetWaist,
        shape: order.targetShape,
        length: order.targetLength,
        wash: order.targetWash as WashCode
      },
      quantity: 1, // Each order is for one item
      orderDate: order.createdAt,
      status: order.status
    }));

    // Group orders that can share production requests
    const processedOrders = new Set<string>();
    const orderGroups: OrderItem[][] = [];

    for (const order of orderItems) {
      if (processedOrders.has(order.orderId)) continue;

      // Try to find an existing production request that can accommodate this order
      const matchingRequest = await findMatchingProductionRequest(order);
      
      if (matchingRequest) {
        // Add order to existing production request's waitlist
        await prisma.waitlist.create({
          data: {
            orderId: order.orderId,
            productionRequestId: matchingRequest.id,
            position: (matchingRequest.waitlist?.length || 0) + 1
          }
        });
        processedOrders.add(order.orderId);
        continue;
      }

      // If no matching request exists, start a new group
      const currentGroup = [order];
      processedOrders.add(order.orderId);

      // Find other orders that could be produced together
      for (const otherOrder of orderItems) {
        if (processedOrders.has(otherOrder.orderId)) continue;

        const canGroup = (
          order.targetSku.style === otherOrder.targetSku.style &&
          order.targetSku.waist === otherOrder.targetSku.waist &&
          order.targetSku.shape === otherOrder.targetSku.shape &&
          order.targetSku.length === otherOrder.targetSku.length &&
          order.targetSku.wash === otherOrder.targetSku.wash
        );

        if (canGroup) {
          currentGroup.push(otherOrder);
          processedOrders.add(otherOrder.orderId);
        }
      }

      orderGroups.push(currentGroup);
    }

    // Create production requests for each group
    await Promise.all(orderGroups.map(group => createProductionRequest(group)));

    // Update order statuses
    await prisma.order.updateMany({
      where: {
        id: {
          in: Array.from(processedOrders)
        }
      },
      data: {
        status: STATUS.STATUS1.ASSIGNED
      }
    });

    return res.status(200).json({
      message: 'Production requests created successfully',
      processedOrders: processedOrders.size,
      productionRequestsCreated: orderGroups.length
    });
  } catch (error) {
    console.error('Error creating production requests:', error);
    return res.status(500).json({ error: 'Failed to create production requests' });
  }
} 