import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { findExactSkuMatch, findUniversalSkuMatch, createProductionRequest } from '@/lib/inventory';
import { WashCode } from '@/lib/sku';
import { Prisma } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: id as string },
        include: {
          customer: true,
          items: true,
          waitlistEntries: {
            include: {
              productionRequest: true
            }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Format the response to match the OrderDetails interface
      const response = {
        id: order.id,
        customer: {
          id: order.customer?.id || '',
          name: order.customer?.name || 'Unknown',
          email: order.customer?.email
        },
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map(item => ({
          id: item.id,
          sku: `${item.style}-${item.waist}-${item.shape}-${item.length}-${item.wash}`,
          status: item.status2,
          stage: item.location
        })),
        targetSku: {
          style: order.targetStyle,
          waist: order.targetWaist,
          shape: order.targetShape,
          length: order.targetLength,
          wash: order.targetWash
        },
        buttonColor: order.buttonColor,
        hemType: order.hemType,
        waitlist: order.waitlistEntries.map(entry => ({
          id: entry.id,
          position: entry.position,
          productionRequest: {
            id: entry.productionRequest.id,
            sku: `${entry.productionRequest.style}-${entry.productionRequest.waist}-${entry.productionRequest.shape}-${entry.productionRequest.length}-${entry.productionRequest.wash}`,
            quantity: entry.productionRequest.quantity,
            status: entry.productionRequest.status
          }
        }))
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('[ORDER_DETAIL_API] Error:', error);
      return res.status(500).json({ error: 'Failed to fetch order details' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Get the order
      const order = await prisma.order.findUnique({
        where: { id: id as string },
        include: {
          customer: true
        }
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Try exact SKU match first
      const exactMatches = await findExactSkuMatch({
        style: order.targetStyle,
        waist: order.targetWaist,
        shape: order.targetShape,
        length: order.targetLength,
        wash: order.targetWash as WashCode
      }, 1);

      if (exactMatches.length > 0) {
        // Update the matched item
        const item = exactMatches[0];
        await prisma.item.update({
          where: { id: item.id },
          data: {
            status1: 'ASSIGNED',
            status2: 'WASH_QUEUE',
            location: 'WASH_STAGING',
            orderId: order.id
          }
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Item assigned from exact match',
          item
        });
      }

      // Try universal SKU match
      const universalMatches = await findUniversalSkuMatch({
        style: order.targetStyle,
        waist: order.targetWaist,
        shape: order.targetShape,
        length: order.targetLength,
        wash: order.targetWash as WashCode
      }, 1);

      if (universalMatches.length > 0) {
        // Update the matched item
        const item = universalMatches[0];
        await prisma.item.update({
          where: { id: item.id },
          data: {
            status1: 'ASSIGNED',
            status2: 'WASH_QUEUE',
            location: 'WASH_STAGING',
            orderId: order.id
          }
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Item assigned from universal match',
          item
        });
      }

      // If no matches found, create production request and waitlist
      const productionRequest = await createProductionRequest({
        targetSku: {
          style: order.targetStyle,
          waist: order.targetWaist,
          shape: order.targetShape,
          length: order.targetLength,
          wash: order.targetWash as WashCode
        },
        quantity: 1,
        priority: 'medium',
        waitlistedOrders: [{
          orderId: order.id,
          customerName: order.customer?.name || 'Unknown Customer',
          quantity: 1,
          orderDate: order.createdAt.toISOString(),
          priority: 'medium',
          status: 'waitlisted',
          targetSku: {
            style: order.targetStyle,
            waist: order.targetWaist,
            shape: order.targetShape,
            length: order.targetLength,
            wash: order.targetWash as WashCode
          }
        }]
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Order added to production waitlist',
        productionRequest
      });

    } catch (error) {
      console.error('Error processing order:', error);
      return res.status(500).json({ error: 'Failed to process order' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 