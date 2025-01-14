import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

interface ScanEvent {
  id: string;
  itemId: string;
  type: string;
  timestamp: Date;
  location: string | null;
  success: boolean;
  metadata: any;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const { id } = req.query

  try {
    // Try to find by qrCode first, then by id
    const item = await prisma.item.findFirst({
      where: {
        OR: [
          { qrCode: id as string },
          { id: id as string }
        ]
      },
      include: {
        scanEvents: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        order: {
          include: {
            customer: true
          }
        }
      }
    })

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    // Format the response
    const response = {
      id: item.id,
      qrCode: item.qrCode,
      style: item.style,
      waist: item.waist,
      length: item.length,
      shape: item.shape,
      wash: item.wash,
      fabric: item.fabric,
      status1: item.status1,
      status2: item.status2,
      location: item.location,
      batchId: item.batchId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      scanEvents: item.scanEvents.map((event: ScanEvent) => ({
        id: event.id,
        itemId: event.itemId,
        type: event.type,
        timestamp: event.timestamp,
        location: event.location,
        success: event.success,
        metadata: event.metadata
      })),
      order: item.order ? {
        id: item.order.id,
        customerName: item.order.customer?.name || 'Unknown',
        orderDate: item.order.createdAt,
        status: item.order.status,
        priority: 'medium', // Default priority since it's not in the schema
        targetSku: {
          style: item.order.targetStyle,
          waist: item.order.targetWaist.toString(),
          shape: item.order.targetShape,
          length: item.order.targetLength.toString(),
          wash: item.order.targetWash
        },
        hemType: item.order.hemType,
        buttonColor: item.order.buttonColor
      } : null,
      currentRequest: item.status2 === 'STOCK' ? {
        type: 'AWAITING_ORDER',
        message: 'Item is in storage awaiting an order',
        data: {
          itemId: item.id,
          location: item.location,
          status: 'STOCK'
        }
      } : null
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('[ITEMS_API] Error:', error)
    return res.status(500).json({ error: 'Failed to fetch item details' })
  }
} 