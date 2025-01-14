import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

// Helper function to get SKU string for an item
function getItemSku(item: { style: string; waist: number; shape: string; length: number; wash: string }) {
  return `${item.style}-${item.waist}-${item.shape}-${item.length}-${item.wash}`;
}

// Smart bin assignment logic
async function findOptimalBin(item: any, allBins: any[]) {
  const itemSku = getItemSku(item);
  
  // Filter to only get storage bins
  const storageBins = allBins.filter(bin => bin.type === 'STORAGE');
  
  // 1. First try: Find bin with same SKU that has space
  const sameSKUBin = storageBins.find(bin => {
    const hasSameSku = bin.Item?.some((binItem: any) => getItemSku(binItem) === itemSku);
    return hasSameSku && bin.currentCount < bin.capacity;
  });
  
  if (sameSKUBin) {
    console.log('[STATUS_API] Found bin with same SKU:', sameSKUBin.id);
    return sameSKUBin;
  }
  
  // 2. Second try: Find completely empty bin
  const emptyBin = storageBins.find(bin => bin.currentCount === 0);
  if (emptyBin) {
    console.log('[STATUS_API] Found empty bin:', emptyBin.id);
    return emptyBin;
  }
  
  // 3. Last resort: Find any bin with space, prioritizing bins with most space
  const binsWithSpace = storageBins
    .filter(bin => bin.currentCount < bin.capacity)
    .sort((a, b) => (b.capacity - b.currentCount) - (a.capacity - a.currentCount));
  
  if (binsWithSpace.length > 0) {
    console.log('[STATUS_API] Found bin with space:', binsWithSpace[0].id);
    return binsWithSpace[0];
  }
  
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const { itemId, scanType } = req.body

  if (!itemId || !scanType) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        scanEvents: {
          orderBy: {
            timestamp: 'desc'
          }
        },
        order: true
      }
    })

    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    // Handle bin confirmation scan first - before any other status checks
    if (scanType === 'BIN_CONFIRMATION') {
      const { binQrCode } = req.body;
      
      // Get the latest movement scan event
      const latestMovement = await prisma.scanEvent.findFirst({
        where: {
          itemId: item.id,
          type: 'MOVEMENT_SCAN',
          success: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      if (!latestMovement) {
        return res.status(400).json({ error: 'No pending movement found for this item' });
      }

      // Find the destination bin
      const destinationBin = await prisma.bin.findUnique({
        where: { qrCode: binQrCode }
      });

      if (!destinationBin) {
        return res.status(400).json({ error: 'Invalid storage bin' });
      }

      // Verify bin type based on item status
      if (item.status2 === 'STORAGE_QUEUE' && destinationBin.type !== 'STORAGE') {
        return res.status(400).json({ error: 'Invalid bin type. Item requires a storage bin.' });
      }

      // Check bin capacity
      if (destinationBin.currentCount >= destinationBin.capacity) {
        return res.status(400).json({ error: 'Destination bin is at capacity' });
      }

      // Create bin confirmation event
      await prisma.scanEvent.create({
        data: {
          itemId: item.id,
          type: 'BIN_CONFIRMATION',
          success: true,
          metadata: {
            message: 'Item placed in storage bin',
            binId: destinationBin.id,
            binName: destinationBin.sku,
            oldLocation: item.location,
            newLocation: destinationBin.id
          }
        }
      });

      // Update bin capacity
      await prisma.bin.update({
        where: { id: destinationBin.id },
        data: {
          currentCount: {
            increment: 1
          }
        }
      });

      // Update item status and location
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          status2: 'STOCK',
          location: destinationBin.id,
          binId: destinationBin.id
        }
      });

      return res.status(200).json({ 
        success: true,
        message: 'Storage bin confirmed successfully',
        data: {
          ...updatedItem,
          currentRequest: {
            type: 'AWAITING_ORDER',
            message: 'Item is in storage awaiting an order',
            data: {
              itemId: item.id,
              location: destinationBin.id,
              status: 'STOCK'
            }
          }
        }
      });
    }

    // Handle activation (first scan or PRODUCTION status)
    if (scanType === 'ACTIVATION' && (item.status2 === 'PRODUCTION' || !item.scanEvents.length)) {
      console.log('[STATUS_API] Processing activation for item:', itemId, {
        currentStatus: item.status2,
        hasScans: item.scanEvents.length > 0
      })
      
      // First, change status from PRODUCTION to STOCK
      const activationEvent = await prisma.scanEvent.create({
        data: {
          itemId: item.id,
          type: 'ACTIVATION',
          success: true,
          metadata: {
            message: 'Item activated - Production completed',
            oldStatus1: item.status1,
            oldStatus2: item.status2,
            newStatus2: item.status1 === 'COMMITTED' ? 'WASH_QUEUE' : 'STORAGE_QUEUE',
            oldLocation: item.location,
            newLocation: item.location || 'UNKNOWN'
          }
        }
      })

      console.log('[STATUS_API] Created activation event:', activationEvent)

      // If item is COMMITTED, find the next waitlisted order and assign it
      if (item.status1 === 'COMMITTED') {
        console.log('[STATUS_API] Item is COMMITTED, finding next waitlisted order');
        
        // Find the production request this item belongs to
        const productionRequest = await prisma.productionRequest.findFirst({
          where: {
            items: {
              some: {
                id: item.id
              }
            }
          },
          include: {
            waitlist: {
              orderBy: {
                position: 'asc'
              },
              include: {
                order: true
              },
              take: 1
            }
          }
        });

        if (productionRequest?.waitlist[0]) {
          const nextOrder = productionRequest.waitlist[0].order;
          console.log('[STATUS_API] Found next waitlisted order:', nextOrder.id);

          // Update item to be assigned to this order
          await prisma.item.update({
            where: { id: item.id },
            data: {
              status1: 'ASSIGNED',
              order: {
                connect: {
                  id: nextOrder.id
                }
              }
            }
          });

          // Remove the waitlist entry since it's now assigned
          await prisma.waitlist.delete({
            where: {
              id: productionRequest.waitlist[0].id
            }
          });

          console.log('[STATUS_API] Assigned item to order and removed from waitlist:', nextOrder.id);
        } else {
          console.log('[STATUS_API] No waitlisted orders found for this production request');
        }
      }

      // Update to STOCK status
      const stockUpdate = await prisma.item.update({
        where: { id: itemId },
        data: {
          status2: item.status1 === 'COMMITTED' ? 'WASH_QUEUE' : 'STORAGE_QUEUE'
        }
      })

      console.log('[STATUS_API] Updated item to STOCK:', stockUpdate)

      // Then handle the wash/storage queue based on commitment
      const newStatus2 = item.status1 === 'COMMITTED' ? 'WASH_QUEUE' : 'STORAGE_QUEUE'
      const newLocation = item.status1 === 'COMMITTED' ? 'WASH_STAGING' : 'STORAGE_STAGING'
      
      // Create queue assignment event with specific wash instructions if assigned to an order
      const queueEvent = await prisma.scanEvent.create({
        data: {
          itemId: item.id,
          type: item.status1 === 'COMMITTED' ? 'ASSIGN_TO_WASH' : 'ASSIGN_TO_STORAGE',
          success: true,
          metadata: {
            message: item.status1 === 'COMMITTED' 
              ? item.order 
                ? `Item assigned to ${item.order.targetWash} wash queue - Please scan ${item.order.targetWash} wash bin to confirm`
                : 'Item assigned to wash queue'
              : 'Item assigned to storage queue',
            oldStatus2: 'STOCK',
            newStatus2,
            oldLocation: item.location,
            newLocation,
            ...(item.order && {
              targetWash: item.order.targetWash,
              instructions: `Please scan ${item.order.targetWash} wash bin to confirm placement`
            })
          }
        }
      })

      console.log('[STATUS_API] Created queue assignment event:', queueEvent)

      // If it's going to storage, assign a bin
      if (newStatus2 === 'STORAGE_QUEUE') {
        try {
          console.log('[STATUS_API] Checking for available storage bins...');
          
          // Get available storage bins
          const allBins = await prisma.bin.findMany({
            where: {
              type: 'STORAGE',
              status: 'ACTIVE'
            },
            include: {
              Item: true
            },
            orderBy: {
              currentCount: 'asc'
            }
          });
          
          // Use smart bin assignment
          const assignedBin = await findOptimalBin(item, allBins);

          if (assignedBin) {
            console.log('[STATUS_API] Selected bin for assignment:', assignedBin);
            
            // Create storage assignment event with proper metadata
            const storageEvent = await prisma.scanEvent.create({
              data: {
                itemId: item.id,
                type: 'STORAGE_ASSIGNMENT',
                success: true,
                metadata: {
                  message: `Item assigned to storage bin ${assignedBin.name}`,
                  binId: assignedBin.id,
                  binName: assignedBin.name,
                  binQrCode: assignedBin.qrCode,
                  targetLocation: assignedBin.id,
                  instructions: `Please scan bin ${assignedBin.name} to confirm placement`,
                  itemSku: getItemSku(item)
                }
              }
            });

            console.log('[STATUS_API] Created storage assignment:', {
              itemId: item.id,
              binId: assignedBin.id,
              binQrCode: assignedBin.qrCode,
              event: storageEvent
            });

            // Update item with bin assignment using Prisma relations
            await prisma.item.update({
              where: { id: item.id },
              data: {
                location: assignedBin.id,
                Bin: {
                  connect: {
                    id: assignedBin.id
                  }
                }
              }
            });
            
            // Update bin count
            await prisma.bin.update({
              where: { id: assignedBin.id },
              data: {
                currentCount: {
                  increment: 1
                }
              }
            });

            // Get the updated item
            const updatedItem = await prisma.item.findUnique({
              where: { id: itemId },
              include: {
                order: true,
                scanEvents: {
                  orderBy: {
                    timestamp: 'desc'
                  }
                }
              }
            });

            if (!updatedItem) {
              throw new Error('Failed to fetch updated item');
            }

            console.log('[STATUS_API] Successfully updated item with bin assignment:', {
              itemId: updatedItem.id,
              location: updatedItem.location,
              binId: assignedBin.id
            });

            // Return success response with bin assignment
            return res.status(200).json({
              success: true,
              message: 'Item activated and assigned to storage bin',
              data: {
                itemId: item.id,
                newStatus2: 'STORAGE_QUEUE',
                location: assignedBin.id,
                binAssignment: {
                  binId: assignedBin.id,
                  binQrCode: assignedBin.qrCode,
                  binName: assignedBin.name
                }
              }
            });
          } else {
            console.log('[STATUS_API] No available storage bins found');
            // Create event to indicate no bins available
            await prisma.scanEvent.create({
              data: {
                itemId: item.id,
                type: 'STORAGE_ASSIGNMENT_FAILED',
                success: false,
                metadata: {
                  message: 'No available storage bins found',
                  error: 'All bins are at capacity'
                }
              }
            });

            // Return response indicating no bins available
            return res.status(200).json({
              success: true,
              message: 'Item activated but no storage bins available',
              data: {
                itemId: item.id,
                newStatus2,
                location: newLocation,
                warning: 'No available storage bins'
              }
            });
          }
        } catch (binError: any) {
          console.error('[STATUS_API] Error assigning bin:', binError);
          // Create error event
          await prisma.scanEvent.create({
            data: {
              itemId: item.id,
              type: 'STORAGE_ASSIGNMENT_FAILED',
              success: false,
              metadata: {
                message: 'Failed to assign storage bin',
                error: binError.message
              }
            }
          });

          // Return response with bin assignment error
          return res.status(200).json({
            success: true,
            message: 'Item activated but bin assignment failed',
            data: {
              itemId: item.id,
              newStatus2,
              location: newLocation,
              error: 'Failed to assign storage bin'
            }
          });
        }
      }

      // Return success response for wash queue assignment
      return res.status(200).json({
        success: true,
        message: 'Item activated and assigned to wash queue',
        data: {
          itemId: item.id,
          newStatus2,
          location: newLocation,
          ...(item.order && {
            targetWash: item.order.targetWash
          })
        }
      });
    }

    // Then handle bin assignment for items in STORAGE_QUEUE
    if (item.status2 === 'STORAGE_QUEUE' && scanType === 'MOVEMENT_SCAN') {
      try {
        console.log('[STATUS_API] Processing movement scan:', {
          itemId,
          scanType,
          currentStatus: item.status2
        });

        // Get the latest storage assignment to know which bin to direct them to
        const latestAssignment = await prisma.scanEvent.findFirst({
          where: {
            itemId: item.id,
            type: 'STORAGE_ASSIGNMENT',
            success: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        });

        if (!latestAssignment) {
          return res.status(400).json({ error: 'No storage bin assignment found for this item' });
        }

        // Create movement scan event
        const movementEvent = await prisma.scanEvent.create({
          data: {
            itemId: item.id,
            type: 'MOVEMENT_SCAN',
            success: true,
            metadata: {
              message: 'Item ready for storage bin assignment',
              currentLocation: item.location,
              requiresDestinationScan: true,
              targetBin: (latestAssignment.metadata as any).binQrCode,
              instructions: `Please scan bin ${(latestAssignment.metadata as any).binQrCode} to confirm placement`,
              status2: item.status2
            }
          }
        });

        console.log('[STATUS_API] Created movement event:', {
          eventId: movementEvent.id,
          itemId: item.id
        });

        return res.status(200).json({
          success: true,
          message: 'Item scanned for movement',
          data: {
            itemId: item.id,
            status2: item.status2,
            currentRequest: {
              type: 'MOVEMENT_REQUEST',
              step: 1,
              totalSteps: 2,
              message: `Please go to bin ${(latestAssignment.metadata as any).binQrCode} and scan its QR code to confirm placement`,
              data: { 
                itemId: item.id,
                targetBin: (latestAssignment.metadata as any).binQrCode
              }
            }
          }
        });
      } catch (error: any) {
        console.error('[STATUS_API] Error processing movement scan:', {
          error: error.message,
          stack: error.stack
        });
        return res.status(500).json({ error: 'Failed to process movement scan: ' + error.message });
      }
    }

    // Handle reactivation after laundry
    if (scanType === 'REACTIVATE_FROM_LAUNDRY') {
      if (item.status2 !== 'LAUNDRY') {
        return res.status(400).json({ error: 'Item must be in LAUNDRY status to be reactivated' });
      }

      // Create reactivation scan event
      const reactivationEvent = await prisma.scanEvent.create({
        data: {
          itemId: item.id,
          type: 'REACTIVATE_FROM_LAUNDRY',
          success: true,
          metadata: {
            message: 'Item reactivated from laundry and moved to QC',
            oldStatus2: item.status2,
            newStatus2: 'QC',
            oldLocation: item.location,
            newLocation: 'QC_AREA'
          }
        }
      });

      // Create QC request event
      const qcEvent = await prisma.scanEvent.create({
        data: {
          itemId: item.id,
          type: 'QC_REQUEST',
          success: true,
          metadata: {
            message: 'QC inspection required',
            requiredSteps: [
              'Verify measurements match specifications',
              'Check stitching quality and consistency',
              'Inspect fabric for defects or damage',
              'Verify color consistency',
              'Check labels and tags'
            ]
          }
        }
      });

      // Update item status and location
      const updatedItem = await prisma.item.update({
        where: { id: itemId },
        data: {
          status2: 'QC',
          location: 'QC_AREA'
        },
        include: {
          order: true,
          scanEvents: {
            orderBy: {
              timestamp: 'desc'
            }
          }
        }
      });

      return res.status(200).json({
        message: 'Item reactivated and moved to QC',
        item: updatedItem,
        events: [reactivationEvent, qcEvent]
      });
    }

    // Handle other status transitions
    let newStatus1 = item.status1
    let newStatus2 = item.status2
    let newLocation = item.location

    // For REFRESH_BIN_ASSIGNMENT, try to assign a bin
    if (scanType === 'REFRESH_BIN_ASSIGNMENT' && item.status2 === 'STORAGE_QUEUE') {
      console.log('[STATUS_API] Processing bin assignment refresh');
      
      // Get available storage bins
      const allBins = await prisma.bin.findMany({
        where: {
          type: 'STORAGE',
          status: 'ACTIVE'
        },
        include: {
          Item: true
        },
        orderBy: {
          currentCount: 'asc'
        }
      });

      // Use smart bin assignment
      const assignedBin = await findOptimalBin(item, allBins);

      if (assignedBin) {
        console.log('[STATUS_API] Selected bin for assignment:', assignedBin);
        
        // Create storage assignment event with proper metadata
        const storageEvent = await prisma.scanEvent.create({
          data: {
            itemId: item.id,
            type: 'STORAGE_ASSIGNMENT',
            success: true,
            metadata: {
              message: `Item assigned to storage bin ${assignedBin.name}`,
              binId: assignedBin.id,
              binName: assignedBin.name,
              binQrCode: assignedBin.qrCode,
              targetLocation: assignedBin.id,
              instructions: `Please scan bin ${assignedBin.name} to confirm placement`,
              itemSku: getItemSku(item)
            }
          }
        });

        // Update item with bin assignment using Prisma relations
        await prisma.item.update({
          where: { id: item.id },
          data: {
            location: assignedBin.id,
            Bin: {
              connect: {
                id: assignedBin.id
              }
            }
          }
        });
        
        // Update bin count
        await prisma.bin.update({
          where: { id: assignedBin.id },
          data: {
            currentCount: {
              increment: 1
            }
          }
        });

        newLocation = assignedBin.id;
      }
    }

    switch (item.status2) {
      case 'WASH_QUEUE':
        if (scanType !== 'WASH_BIN_SCAN') {
          return res.status(400).json({ 
            error: 'Items in WASH_QUEUE must use WASH_BIN_SCAN scan type'
          });
        }
        newStatus2 = 'WASH'
        newLocation = 'WASH_AREA'
        break
      
      case 'WASH':
        if (scanType !== 'WASH_BIN_SCAN_OUT') {
          return res.status(400).json({ 
            error: 'Items in WASH must use WASH_BIN_SCAN_OUT scan type'
          });
        }
        newStatus2 = 'LAUNDRY'
        newLocation = 'LAUNDRY'
        
        // Update item's status2 and location immediately
        await prisma.item.update({
          where: { id: itemId },
          data: {
            status2: 'LAUNDRY',
            location: 'LAUNDRY'
          }
        })
        break
      
      case 'LAUNDRY':
        // Items in LAUNDRY status must use REACTIVATE_FROM_LAUNDRY scan type
        if (scanType !== 'REACTIVATE_FROM_LAUNDRY') {
          return res.status(400).json({ 
            error: 'Items in LAUNDRY status must use REACTIVATE_FROM_LAUNDRY scan type'
          });
        }
        newStatus2 = 'QC'
        newLocation = 'QC_AREA'
        break
      
      case 'QC':
        newStatus2 = 'FINISHING'
        newLocation = 'FINISHING_AREA'
        break
      
      case 'FINISHING':
        newStatus2 = 'PACKING'
        newLocation = 'PACKING_AREA'
        break
      
      case 'PACKING':
        newStatus2 = 'SHIPPING'
        newLocation = 'SHIPPING_AREA'
        break
      
      case 'SHIPPING':
        newStatus2 = 'FULFILLED'
        newLocation = 'SHIPPED'
        break
    }

    // Create status transition scan event
    const transitionEvent = await prisma.scanEvent.create({
      data: {
        itemId: item.id,
        type: scanType,
        success: true,
        metadata: {
          oldStatus1: item.status1,
          oldStatus2: item.status2,
          newStatus1,
          newStatus2,
          oldLocation: item.location,
          newLocation
        }
      }
    })

    console.log('[STATUS_API] Created transition event:', transitionEvent)

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        status1: newStatus1,
        status2: newStatus2,
        location: newLocation
      },
      include: {
        order: true,
        scanEvents: {
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    })

    console.log('[STATUS_API] Updated item after transition:', updatedItem)
    return res.status(200).json(updatedItem)
  } catch (error) {
    console.error('[STATUS_API] Error:', error)
    return res.status(500).json({ error: 'Failed to update item status' })
  }
} 