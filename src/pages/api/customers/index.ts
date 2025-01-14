import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          include: {
            items: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to include order counts and other relevant info
    const transformedCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || 'N/A',
      address: customer.address || 'N/A',
      createdAt: customer.createdAt,
      totalOrders: customer.orders.length,
      orders: customer.orders.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        status1: order.status1,
        status2: order.status2,
        targetSku: `${order.targetStyle}-${order.targetWaist}-${order.targetShape}-${order.targetLength}-${order.targetWash}`,
        items: order.items.length
      }))
    }));

    return res.status(200).json(transformedCustomers);
  } catch (error) {
    console.error('[CUSTOMERS_API] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
} 