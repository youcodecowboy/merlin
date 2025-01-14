import { SKU, isExactMatch, isUniversalMatch, WashCode, getUniversalWash } from './sku';
import prisma from '@/lib/prisma';

export async function findExactSkuMatch(targetSku: SKU, quantity: number) {
  // Find UNCOMMITTED items in STOCK that exactly match the target SKU
  const exactMatches = await prisma.item.findMany({
    where: {
      style: targetSku.style,
      waist: targetSku.waist,
      shape: targetSku.shape,
      length: targetSku.length,
      wash: targetSku.wash,
      status1: 'UNCOMMITTED',
      status2: 'STOCK'
    },
    take: quantity
  });

  return exactMatches;
}

export async function findUniversalSkuMatch(targetSku: SKU, quantity: number) {
  // Find UNCOMMITTED items in STOCK that match the universal SKU criteria
  const universalMatches = await prisma.item.findMany({
    where: {
      style: targetSku.style,
      waist: targetSku.waist,
      shape: targetSku.shape,
      length: {
        gte: targetSku.length // Length must be greater than or equal to target
      },
      wash: {
        in: ['RAW', 'BRW'] // Only universal wash codes
      },
      status1: 'UNCOMMITTED',
      status2: 'STOCK'
    },
    take: quantity
  });

  // Filter to ensure the universal wash matches the target wash group
  return universalMatches.filter(item => 
    isUniversalMatch(targetSku, {
      style: item.style,
      waist: item.waist,
      shape: item.shape,
      length: item.length,
      wash: item.wash as WashCode
    })
  );
}

export async function createProductionRequest(request: {
  targetSku: SKU;
  quantity: number;
  priority: 'high' | 'medium' | 'low';
  waitlistedOrders: {
    orderId: string;
    customerName: string;
    quantity: number;
    orderDate: string;
    priority: 'high' | 'medium' | 'low';
    status: string;
    targetSku: SKU;
  }[];
}) {
  // Create a new production request for the universal SKU
  const productionRequest = await prisma.productionRequest.create({
    data: {
      style: request.targetSku.style,
      waist: request.targetSku.waist,
      shape: request.targetSku.shape,
      length: 36, // Universal length
      wash: getUniversalWash(request.targetSku.wash),
      quantity: request.quantity,
      status: 'PENDING',
      waitlist: {
        create: request.waitlistedOrders.map((order, index) => ({
          orderId: order.orderId,
          position: index + 1
        }))
      }
    }
  });

  return productionRequest;
} 