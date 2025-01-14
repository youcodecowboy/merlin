import { Unit, TargetSku } from './production';

export interface Order {
  id: string;
  customerName: string;
  status: 'NEW' | 'PROCESSING' | 'WAITLISTED' | 'ASSIGNED' | 'READY' | 'SHIPPED';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  targetSku: TargetSku;
  quantity: number;
  status: 'PENDING' | 'WAITLISTED' | 'ASSIGNED';
  assignedUnits?: string[]; // Unit IDs
}

// Mock database
let mockOrders: Order[] = [];

// Helper functions
function generateOrderId(): string {
  return `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

function generateOrderItemId(): string {
  return `ITEM-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// API Functions
export const ordersApi = {
  // Create a new order
  createOrder: async (
    customerName: string,
    priority: Order['priority'],
    items: { targetSku: TargetSku; quantity: number }[]
  ): Promise<Order> => {
    const order: Order = {
      id: generateOrderId(),
      customerName,
      status: 'NEW',
      priority,
      createdAt: new Date().toISOString(),
      items: items.map(item => ({
        id: generateOrderItemId(),
        targetSku: item.targetSku,
        quantity: item.quantity,
        status: 'PENDING'
      }))
    };

    mockOrders = [...mockOrders, order];
    return order;
  },

  // Process a new order
  processOrder: async (orderId: string): Promise<Order> => {
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    order.status = 'PROCESSING';

    // Process each item in the order
    for (const item of order.items) {
      // Import required functions from inventory API
      const { findExactSkuMatch, findUniversalSkuMatch, createProductionRequest } = await import('./inventory');

      // Try exact SKU match first
      const exactMatches = await findExactSkuMatch(item.targetSku, item.quantity);
      
      if (exactMatches.length >= item.quantity) {
        // Assign exact matches
        item.status = 'ASSIGNED';
        item.assignedUnits = exactMatches.slice(0, item.quantity).map(unit => unit.id);
        continue;
      }

      // Try universal SKU match
      const universalMatches = await findUniversalSkuMatch(item.targetSku, item.quantity - exactMatches.length);
      
      if (exactMatches.length + universalMatches.length >= item.quantity) {
        // Assign combination of exact and universal matches
        item.status = 'ASSIGNED';
        item.assignedUnits = [
          ...exactMatches.map(unit => unit.id),
          ...universalMatches.map(unit => unit.id)
        ];
        continue;
      }

      // If no matches found, create production request and waitlist
      item.status = 'WAITLISTED';
      await createProductionRequest({
        targetSku: item.targetSku,
        quantity: item.quantity - (exactMatches.length + universalMatches.length),
        priority: order.priority,
        waitlistedOrders: [{
          orderId: order.id,
          customerName: order.customerName,
          quantity: item.quantity - (exactMatches.length + universalMatches.length),
          orderDate: order.createdAt,
          priority: order.priority,
          status: 'waitlisted',
          targetSku: item.targetSku
        }]
      });

      // Assign any found units
      if (exactMatches.length + universalMatches.length > 0) {
        item.assignedUnits = [
          ...exactMatches.map(unit => unit.id),
          ...universalMatches.map(unit => unit.id)
        ];
      }
    }

    // Update order status based on items
    if (order.items.every(item => item.status === 'ASSIGNED')) {
      order.status = 'ASSIGNED';
    } else if (order.items.some(item => item.status === 'WAITLISTED')) {
      order.status = 'WAITLISTED';
    }

    return order;
  },

  // Get order by ID
  getOrder: async (orderId: string): Promise<Order | null> => {
    return mockOrders.find(o => o.id === orderId) || null;
  },

  // Get all orders
  getOrders: async (): Promise<Order[]> => {
    return mockOrders;
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<Order> => {
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    
    order.status = status;
    return order;
  },

  // Get waitlisted orders for a specific SKU
  getWaitlistedOrdersForSku: async (sku: TargetSku): Promise<Array<{ order: Order; item: OrderItem }>> => {
    const waitlisted: Array<{ order: Order; item: OrderItem }> = [];

    for (const order of mockOrders) {
      for (const item of order.items) {
        if (
          item.status === 'WAITLISTED' &&
          item.targetSku.style === sku.style &&
          item.targetSku.waist === sku.waist &&
          item.targetSku.shape === sku.shape &&
          parseInt(item.targetSku.length) <= parseInt(sku.length) &&
          (
            (sku.wash === 'RAW' && ['STA', 'IND'].includes(item.targetSku.wash)) ||
            (sku.wash === 'BRW' && ['ONX', 'JAG'].includes(item.targetSku.wash))
          )
        ) {
          waitlisted.push({ order, item });
        }
      }
    }

    // Sort by priority and creation date
    return waitlisted.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.order.priority] !== priorityOrder[b.order.priority]) {
        return priorityOrder[a.order.priority] - priorityOrder[b.order.priority];
      }
      return new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime();
    });
  }
}; 