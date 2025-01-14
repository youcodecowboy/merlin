import { SKU, WashCode, getUniversalSKU, isUniversalMatch } from './sku';
import prisma from '@/lib/prisma';
import { ProductionRequest } from '@prisma/client';

export interface OrderItem {
  orderId: string;
  targetSku: SKU;
  customerName: string;
  quantity: number;
  orderDate: Date;
  status: string;
}

interface ProductionRequestCreate {
  style: string;
  waist: number;
  shape: string;
  length: number;
  wash: WashCode;
  quantity: number;
  waitlistedOrders: string[];
}

export async function createProductionRequest(orders: OrderItem[]): Promise<void> {
  const skuGroups = new Map<string, OrderItem[]>();
  
  // Group orders by SKU
  orders.forEach(order => {
    const universalSku = getUniversalSKU(order.targetSku);
    const skuKey = `${universalSku.style}-${universalSku.waist}-${universalSku.shape}-${universalSku.length}-${universalSku.wash}`;
    const existingGroup = skuGroups.get(skuKey) || [];
    skuGroups.set(skuKey, [...existingGroup, order]);
  });

  // Create or update production requests for each SKU group
  for (const [skuKey, groupOrders] of skuGroups) {
    const firstOrder = groupOrders[0];
    const universalSku = getUniversalSKU(firstOrder.targetSku);
    
    // Calculate total quantity needed
    const totalQuantity = groupOrders.reduce((sum, order) => sum + order.quantity, 0);

    // Check for existing production request with this universal SKU
    const existingRequest = await prisma.productionRequest.findFirst({
      where: {
        style: universalSku.style,
        waist: universalSku.waist,
        shape: universalSku.shape,
        length: universalSku.length,
        wash: universalSku.wash,
        status: 'PENDING'
      },
      include: {
        waitlist: true
      }
    });

    if (existingRequest) {
      // Add orders to existing request's waitlist
      await prisma.productionRequest.update({
        where: { id: existingRequest.id },
        data: {
          quantity: existingRequest.quantity + totalQuantity,
          waitlist: {
            create: groupOrders.map((order, index) => ({
              orderId: order.orderId,
              position: (existingRequest.waitlist?.length || 0) + index + 1
            }))
          }
        }
      });
    } else {
      // Create new production request
      await prisma.productionRequest.create({
        data: {
          style: universalSku.style,
          waist: universalSku.waist,
          shape: universalSku.shape,
          length: universalSku.length,
          wash: universalSku.wash,
          quantity: totalQuantity,
          status: 'PENDING',
          waitlist: {
            create: groupOrders.map((order, index) => ({
              orderId: order.orderId,
              position: index + 1
            }))
          }
        }
      });
    }
  }
}

export async function findMatchingProductionRequest(order: OrderItem) {
  // First try to find an exact match
  const exactMatch = await prisma.productionRequest.findFirst({
    where: {
      style: order.targetSku.style,
      waist: order.targetSku.waist,
      shape: order.targetSku.shape,
      length: order.targetSku.length,
      wash: order.targetSku.wash,
      status: 'PENDING'
    },
    include: {
      waitlist: true
    }
  });

  if (exactMatch) {
    return exactMatch;
  }

  // If no exact match, try to find a universal match
  const universalSku = getUniversalSKU(order.targetSku);
  const universalMatches = await prisma.productionRequest.findMany({
    where: {
      style: universalSku.style,
      waist: universalSku.waist,
      shape: universalSku.shape,
      wash: universalSku.wash,
      status: 'PENDING'
    },
    include: {
      waitlist: true
    }
  });

  // Find the best universal match (one that can accommodate our length)
  return universalMatches.find((req: ProductionRequest) => 
    isUniversalMatch(order.targetSku, {
      style: req.style,
      waist: req.waist,
      shape: req.shape,
      length: req.length,
      wash: req.wash as WashCode
    })
  );
} 