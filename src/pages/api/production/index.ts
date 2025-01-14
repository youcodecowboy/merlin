import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient, ProductionRequest as PrismaProductionRequest } from '@prisma/client'
import { ProductionRequest as FrontendProductionRequest } from '@/types/production'

const productionRequestInclude = {
  waitlist: {
    include: {
      order: {
        include: {
          customer: true
        }
      }
    }
  },
  items: true
} as const

interface WaitlistWithOrder {
  order: {
    id: string;
    createdAt: Date;
    status: string;
    targetStyle: string;
    targetWaist: number;
    targetShape: string;
    targetLength: number;
    targetWash: string;
    customer?: {
      name: string;
    } | null;
  };
}

interface ExtendedProductionRequest extends PrismaProductionRequest {
  items: Array<{
    id: string;
    batchId: string | null;
  }>;
  waitlist: Array<WaitlistWithOrder>;
}

function getDaysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Export the handler as the default export
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('[PRODUCTION_API] Received request:', req.method);
  
  if (req.method === 'GET') {
    try {
      console.log('[PRODUCTION_API] Fetching production requests...');
      const productionRequests = await prisma.productionRequest.findMany({
        include: productionRequestInclude,
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('[PRODUCTION_API] Raw production requests:', JSON.stringify(productionRequests, null, 2));

      // Transform the data to match the frontend interface
      const transformedRequests = productionRequests.map((request: ExtendedProductionRequest) => {
        try {
          console.log('[PRODUCTION_API] Transforming request:', request.id);
          
          // Find the batch ID from items if available
          const batchId = request.items.find(item => item.batchId)?.batchId;
          
          return {
            id: batchId || request.id,
            style: request.style,
            waist: request.waist,
            length: request.length,
            shape: request.shape,
            wash: request.wash,
            quantity: request.quantity,
            status: request.status,
            daysSinceCreated: getDaysSince(request.createdAt),
            requestedDate: request.createdAt.toISOString(),
            completedQuantity: request.status === 'IN_PROGRESS' ? request.quantity : 0,
            waitlistedOrders: request.waitlist.map((entry) => ({
              orderId: entry.order.id,
              customerName: entry.order.customer?.name || 'Unknown',
              quantity: 1,
              orderDate: entry.order.createdAt.toISOString(),
              status: entry.order.status,
              targetSku: {
                style: entry.order.targetStyle,
                waist: entry.order.targetWaist,
                shape: entry.order.targetShape,
                length: entry.order.targetLength,
                wash: entry.order.targetWash
              }
            }))
          };
        } catch (transformError) {
          console.error('[PRODUCTION_API] Error transforming request:', request.id, transformError);
          throw transformError;
        }
      });

      console.log('[PRODUCTION_API] Transformed requests:', JSON.stringify(transformedRequests, null, 2));
      return res.status(200).json(transformedRequests);
    } catch (error) {
      console.error('[PRODUCTION_API] Failed to fetch production requests:', error instanceof Error ? error.stack : error);
      console.error('[PRODUCTION_API] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return res.status(500).json({ error: String(error) });
    }
  }

  if (req.method === 'POST') {
    try {
      // Ensure the request body is parsed as JSON
      if (!req.body || typeof req.body !== 'object') {
        console.error('[PRODUCTION_API] Invalid request body:', req.body);
        return res.status(400).json({ error: 'Invalid request body format' });
      }

      const { requestId, action } = req.body;
      console.log('[PRODUCTION_API] POST request body:', { requestId, action, fullBody: req.body });

      if (!requestId || !action) {
        console.error('[PRODUCTION_API] Missing required fields:', { requestId, action });
        return res.status(400).json({ error: 'Missing required fields: requestId and action' });
      }

      if (action === 'accept') {
        console.log('[PRODUCTION_API] Accepting production request:', requestId);
        
        // Get the production request with its waitlist
        const request = await prisma.productionRequest.findUnique({
          where: { id: requestId },
          include: productionRequestInclude
        });
        console.log('[PRODUCTION_API] Found request:', request ? 'yes' : 'no');

        if (!request) {
          console.error('[PRODUCTION_API] Production request not found:', requestId);
          return res.status(404).json({ error: 'Production request not found' });
        }

        if (request.status !== 'PENDING') {
          console.error('[PRODUCTION_API] Invalid request status:', request.status);
          return res.status(400).json({ error: 'Production request must be in PENDING state' });
        }

        try {
          const result = await prisma.$transaction(async (tx) => {
            // Create a pattern request for the universal SKU
            const patternRequest = await tx.patternRequest.create({
              data: {
                sku: `${request.style}-${request.waist}-${request.shape}-${request.length}-${request.wash}`,
                quantity: request.quantity,
                status: 'PENDING'
              }
            });
            console.log('[PRODUCTION_API] Created pattern request:', patternRequest.id);

            // Generate batch ID for the production run
            const batchId = uuidv4();
            console.log('[PRODUCTION_API] Generated batch ID:', batchId);

            // Create the batch
            const batch = await tx.batch.create({
              data: {
                id: batchId,
                status: 'IN_PROGRESS',
                productionRequest: {
                  connect: {
                    id: request.id
                  }
                }
              }
            });
            console.log('[PRODUCTION_API] Created batch:', batch.id);

            // Create items for the batch
            const waitlistCount = request.waitlist.length;
            const items = await Promise.all(
              Array.from({ length: request.quantity }).map(async (_, index) => {
                const qrCode = uuidv4();
                return tx.item.create({
                  data: {
                    qrCode,
                    style: request.style,
                    waist: request.waist,
                    shape: request.shape,
                    length: request.length,
                    wash: request.wash,
                    status1: index < waitlistCount ? 'COMMITTED' : 'UNCOMMITTED',
                    status2: 'PRODUCTION',
                    batch: {
                      connect: {
                        id: batch.id
                      }
                    },
                    productionRequest: {
                      connect: {
                        id: request.id
                      }
                    },
                    // If there's a waitlist entry for this index, connect it to the order
                    ...(index < waitlistCount && {
                      order: {
                        connect: {
                          id: request.waitlist[index].orderId
                        }
                      }
                    })
                  }
                });
              })
            );
            console.log('[PRODUCTION_API] Created items:', items.length, 'with', waitlistCount, 'committed to orders');

            // After creating items, update order statuses for committed items
            if (waitlistCount > 0) {
              console.log('[PRODUCTION_API] Updating order statuses for committed items');
              
              // Get all waitlist entries for this production request
              const waitlistEntries = await prisma.waitlist.findMany({
                where: {
                  productionRequestId: request.id
                },
                include: {
                  order: true
                },
                take: waitlistCount
              });

              // Update each order's status to reflect the committed item
              await Promise.all(waitlistEntries.map(entry => 
                prisma.order.update({
                  where: { id: entry.orderId },
                  data: {
                    status1: 'COMMITTED',
                    status2: 'PRODUCTION'
                  }
                })
              ));

              console.log('[PRODUCTION_API] Updated order statuses for', waitlistEntries.length, 'orders');
            }

            // Update production request status
            const updatedRequest = await tx.productionRequest.update({
              where: { id: request.id },
              data: { status: 'IN_PROGRESS' }
            });
            console.log('[PRODUCTION_API] Updated production request status');

            return {
              batchId: batch.id,
              items,
              patternRequest
            };
          });

          console.log('[PRODUCTION_API] Transaction completed successfully');
          return res.status(200).json({
            success: true,
            message: 'Production request accepted successfully',
            data: {
              batchId: result.batchId,
              itemsCreated: result.items.length,
              patternRequestId: result.patternRequest.id
            }
          });
        } catch (txError) {
          console.error('[PRODUCTION_API] Transaction failed:', txError instanceof Error ? txError.stack : txError);
          return res.status(500).json({ 
            success: false,
            error: txError instanceof Error ? txError.message : 'Transaction failed'
          });
        }
      }

      return res.status(400).json({ 
        success: false,
        error: 'Invalid action'
      });
    } catch (error) {
      console.error('[PRODUCTION_API] Failed to process production request:', error instanceof Error ? error.stack : error);
      return res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process production request'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default handler; 