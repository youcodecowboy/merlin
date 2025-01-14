import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../db';
import { STATUS } from '../../../lib/sku';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const orders = await prisma.order.findMany({
        include: {
          customer: true,
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { customerId, items } = req.body;

      if (!customerId || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      const order = await prisma.order.create({
        data: {
          customerId,
          status1: 'CREATED',
          status2: 'PENDING',
          targetStyle: items[0].style,
          targetWaist: items[0].waist,
          targetShape: items[0].shape,
          targetLength: items[0].length,
          targetWash: items[0].wash,
          buttonColor: items[0].buttonColor || 'WHITE',
          hemType: items[0].hemType || 'ORL'
        },
        include: {
          customer: true
        }
      });

      return res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 