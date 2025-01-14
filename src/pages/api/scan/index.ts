import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { Prisma } from '@prisma/client';

// Define response type
type ScanResponse = {
  ok: boolean;
  error?: string;
  scanEvent?: any;
  item?: any;
  nextAction?: {
    type: string;
    message: string;
    data?: any;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScanResponse>
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed` 
    });
    return;
  }

  try {
    // Log the raw request
    console.log('[SCAN_API] Raw request:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Ensure we have a body
    if (!req.body || typeof req.body !== 'object') {
      console.error('[SCAN_API] Invalid request body:', req.body);
      return res.status(400).json({
        ok: false,
        error: 'Invalid request body'
      });
    }

    const { qrCode, type, location, success, metadata = {} } = req.body;

    if (!qrCode || !type) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    // Find the item by QR code
    const item = await prisma.item.findUnique({
      where: { qrCode },
      include: {
        assignedBin: true,
        order: true,
        scanEvents: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item not found" });
    }

    // Handle different scan types
    switch (type) {
      case 'ACTIVATION_SCAN': {
        // Check if item can be activated
        if (item.status2 !== 'PRODUCTION') {
          return res.status(400).json({ 
            ok: false, 
            error: "Item cannot be activated - invalid status",
            scanEvent: await createScanEvent(item.id, type, location, false, {
              error: "Invalid item status for activation",
              currentStatus: item.status2
            })
          });
        }

        // Check if item is already activated
        const hasActivationScan = item.scanEvents.some(event => 
          event.type === 'ACTIVATION_SCAN' && event.success
        );

        if (hasActivationScan) {
          return res.status(400).json({
            ok: false,
            error: "Item is already activated",
            scanEvent: await createScanEvent(item.id, type, location, false, {
              error: "Item already activated",
              currentStatus: item.status2
            })
          });
        }

        // Determine next status based on commitment
        const newStatus1 = item.status1 === 'COMMITTED' ? 'ASSIGNED' : 'STOCK';
        const newStatus2 = item.status1 === 'COMMITTED' ? 'WASH_QUEUE' : 'STORAGE_QUEUE';
        const newLocation = item.status1 === 'COMMITTED' ? 'WASH_STAGING' : 'STORAGE_STAGING';

        // Update item status
        const updatedItem = await prisma.item.update({
          where: { id: item.id },
          data: {
            status1: newStatus1,
            status2: newStatus2,
            location: newLocation
          }
        });

        // Create successful scan event
        const scanEvent = await createScanEvent(item.id, type, location, true, {
          previousStatus1: item.status1,
          previousStatus2: item.status2,
          newStatus1,
          newStatus2,
          previousLocation: item.location,
          newLocation
        });

        return res.status(200).json({
          ok: true,
          item: updatedItem,
          scanEvent,
          nextAction: {
            type: 'NAVIGATE',
            message: 'Item activated successfully',
            data: { path: `/items/${item.id}/activate` }
          }
        });
      }

      case 'MOVEMENT_SCAN': {
        // Check if this is a destination scan (second part of movement)
        const pendingMovement = await prisma.scanEvent.findFirst({
          where: {
            itemId: item.id,
            type: 'MOVEMENT_SCAN',
            success: true,
            metadata: {
              path: ['requiresDestinationScan'],
              equals: true
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        });

        if (pendingMovement) {
          // This is a destination scan - validate the bin
          const destinationBin = await prisma.bin.findUnique({
            where: { qrCode }
          });

          if (!destinationBin) {
            return res.status(400).json({
              ok: false,
              error: "Invalid destination bin",
              scanEvent: await createScanEvent(item.id, type, location, false, {
                error: "Invalid destination bin QR code",
                scannedQrCode: qrCode
              })
            });
          }

          // Validate bin type based on item status
          let isValidBin = false;
          let expectedBinType = '';

          switch (item.status2) {
            case 'WASH_QUEUE':
              isValidBin = destinationBin.type === 'WASH';
              expectedBinType = 'wash';
              break;
            case 'STORAGE_QUEUE':
              isValidBin = destinationBin.type === 'STORAGE';
              expectedBinType = 'storage';
              break;
            // Add other status validations as needed
          }

          if (!isValidBin) {
            return res.status(400).json({
              ok: false,
              error: `Invalid bin type. Item requires a ${expectedBinType} bin.`,
              scanEvent: await createScanEvent(item.id, type, location, false, {
                error: `Invalid bin type. Expected ${expectedBinType} bin.`,
                scannedBinType: destinationBin.type,
                requiredBinType: expectedBinType
              })
            });
          }

          // Check bin capacity
          if (destinationBin.currentCount >= destinationBin.capacity) {
            return res.status(400).json({
              ok: false,
              error: "Destination bin is at capacity",
              scanEvent: await createScanEvent(item.id, type, location, false, {
                error: "Bin at capacity",
                binId: destinationBin.id,
                currentCount: destinationBin.currentCount,
                capacity: destinationBin.capacity
              })
            });
          }

          // Update item location and bin assignment
          const updatedItem = await prisma.item.update({
            where: { id: item.id },
            data: {
              location: destinationBin.sku,
              assignedBinId: destinationBin.id
            }
          });

          // Increment bin count
          await prisma.bin.update({
            where: { id: destinationBin.id },
            data: {
              currentCount: {
                increment: 1
              }
            }
          });

          // Record successful movement completion
          const scanEvent = await createScanEvent(item.id, type, location, true, {
            previousLocation: item.location,
            newLocation: destinationBin.sku,
            destinationBinId: destinationBin.id,
            movementComplete: true
          });

          return res.status(200).json({
            ok: true,
            item: updatedItem,
            scanEvent,
            nextAction: {
              type: 'NAVIGATE',
              message: 'Item moved successfully',
              data: { path: `/items/${item.id}` }
            }
          });

        } else {
          // This is the first scan - record item selection and await destination
          const scanEvent = await createScanEvent(item.id, type, location, true, {
            currentLocation: item.location,
            requiresDestinationScan: true,
            status2: item.status2 // Include current status to help validate destination
          });

          return res.status(200).json({
            ok: true,
            item,
            scanEvent,
            nextAction: {
              type: 'AWAIT_DESTINATION',
              message: `Please scan ${item.status2 === 'WASH_QUEUE' ? 'wash' : 'destination'} bin`,
              data: { itemId: item.id }
            }
          });
        }
      }

      case 'LOOKUP_SCAN': {
        // Simple lookup scan, just record it
        const scanEvent = await createScanEvent(item.id, type, location, true, {
          currentLocation: item.location,
          currentStatus1: item.status1,
          currentStatus2: item.status2
        });

        return res.status(200).json({
          ok: true,
          item,
          scanEvent,
          nextAction: {
            type: 'NAVIGATE',
            message: 'Item found',
            data: { path: `/items/${item.id}` }
          }
        });
      }

      case 'DEFECT_SCAN': {
        // Update item status to DEFECT
        const updatedItem = await prisma.item.update({
          where: { id: item.id },
          data: {
            status2: 'DEFECT'
          }
        });

        // Record defect scan and prepare for defect report
        const scanEvent = await createScanEvent(item.id, type, location, true, {
          previousStatus1: item.status1,
          previousStatus2: item.status2,
          newStatus1: item.status1,
          newStatus2: 'DEFECT',
          requiresDefectReport: true
        });

        return res.status(200).json({
          ok: true,
          item: updatedItem,
          scanEvent,
          nextAction: {
            type: 'NAVIGATE',
            message: 'Please fill defect report',
            data: { path: `/items/${item.id}/defect` }
          }
        });
      }

      default: {
        // Unknown scan type
        return res.status(400).json({
          ok: false,
          error: `Unknown scan type: ${type}`,
          scanEvent: await createScanEvent(item.id, type, location, false, {
            error: `Unknown scan type: ${type}`
          })
        });
      }
    }
  } catch (error) {
    console.error('[SCAN_API] Error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to record scan' 
    });
  }
}

async function createScanEvent(
  itemId: string,
  type: string,
  location: string | null,
  success: boolean,
  metadata: any = {}
) {
  return prisma.scanEvent.create({
    data: {
      itemId,
      type,
      location,
      success,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }
  });
} 