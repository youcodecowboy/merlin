import { v4 as uuidv4 } from 'uuid';

// Types
export interface TargetSku {
  style: string;
  waist: string;
  shape: string;
  length: string;
  wash: string;
}

export interface WaitlistedOrder {
  orderId: string;
  customerName: string;
  quantity: number;
  orderDate: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  targetSku: TargetSku;
}

export interface ProductionRequest {
  id: string;
  sku: string;
  quantity: number;
  status: string;
  priority: 'high' | 'medium' | 'low';
  requestedDate: string;
  waitlistedOrders: WaitlistedOrder[];
}

export interface Unit {
  id: string;
  sku: string;
  batchId: string;
  status1: 'UNCOMMITTED' | 'COMMITTED' | 'ASSIGNED' | 'STOCK';
  status2: 'PRODUCTION' | 'WASH_QUEUE' | 'WASHING' | 'LAUNDRY' | 'QC' | 'FINISHING' | 'PACKING' | 'SHIPPING' | 'FULFILLED';
  location: string;
  createdAt: string;
  orderId?: string;
}

// Mock database
let mockProductionRequests: ProductionRequest[] = [
  {
    id: 'PR001',
    sku: 'ST-32-X-36-RAW',
    quantity: 150,
    status: 'pending',
    priority: 'high',
    requestedDate: '2024-01-09T14:30:00',
    waitlistedOrders: [
      {
        orderId: 'ORD-2024-001',
        customerName: 'John Smith',
        quantity: 2,
        orderDate: '2024-01-05T10:30:00',
        priority: 'high',
        status: 'waitlisted',
        targetSku: {
          style: 'ST',
          waist: '32',
          shape: 'X',
          length: '32',
          wash: 'STA'
        }
      }
    ]
  }
];

let mockUnits: Unit[] = [];

// Helper functions
function generateUnitId(): string {
  return `UNIT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

function generateBatchId(): string {
  return `BATCH-${Date.now()}-${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
}

function parseSkuComponents(sku: string): { style: string; waist: string; shape: string; length: string; wash: string } {
  const [style, waist, shape, length, wash] = sku.split('-');
  return { style, waist, shape, length, wash };
}

// API Functions
export const productionApi = {
  // Get all production requests
  getProductionRequests: async (): Promise<ProductionRequest[]> => {
    return mockProductionRequests;
  },

  // Get a single production request
  getProductionRequest: async (id: string): Promise<ProductionRequest | null> => {
    return mockProductionRequests.find(req => req.id === id) || null;
  },

  // Modify a production request
  modifyProductionRequest: async (
    id: string,
    modifications: {
      newQuantity?: number;
      newInseam?: number;
    }
  ): Promise<ProductionRequest> => {
    const request = mockProductionRequests.find(req => req.id === id);
    if (!request) {
      throw new Error('Production request not found');
    }

    // Calculate minimum allowed inseam
    const minAllowedLength = Math.max(
      ...request.waitlistedOrders.map(order => parseInt(order.targetSku.length))
    );

    // Validate modifications
    if (modifications.newInseam && modifications.newInseam < minAllowedLength) {
      throw new Error(`Inseam cannot be shorter than ${minAllowedLength} due to waitlist requirements`);
    }

    if (modifications.newQuantity && modifications.newQuantity <= request.quantity) {
      throw new Error('New quantity must be greater than current quantity');
    }

    // Update the SKU if inseam is modified
    if (modifications.newInseam) {
      const { style, waist, shape, wash } = parseSkuComponents(request.sku);
      request.sku = `${style}-${waist}-${shape}-${modifications.newInseam}-${wash}`;
    }

    // Update quantity
    if (modifications.newQuantity) {
      request.quantity = modifications.newQuantity;
    }

    return request;
  },

  // Accept a production request and create units
  acceptProductionRequest: async (id: string): Promise<{ units: Unit[]; request: ProductionRequest }> => {
    const request = mockProductionRequests.find(req => req.id === id);
    if (!request) {
      throw new Error('Production request not found');
    }

    const batchId = generateBatchId();
    const newUnits: Unit[] = [];

    // Create units
    for (let i = 0; i < request.quantity; i++) {
      const unit: Unit = {
        id: generateUnitId(),
        sku: request.sku,
        batchId,
        status1: 'UNCOMMITTED',
        status2: 'PRODUCTION',
        location: 'PRODUCTION_FLOOR',
        createdAt: new Date().toISOString()
      };
      newUnits.push(unit);
    }

    // Process waitlist assignments
    const waitlistedQuantity = request.waitlistedOrders.reduce((sum, order) => sum + order.quantity, 0);
    const unitsToCommit = Math.min(waitlistedQuantity, request.quantity);

    // Assign units to waitlisted orders
    for (let i = 0; i < unitsToCommit; i++) {
      newUnits[i].status1 = 'COMMITTED';
    }

    // Update mock database
    mockUnits = [...mockUnits, ...newUnits];
    request.status = 'accepted';

    return {
      units: newUnits,
      request
    };
  },

  // Get units by batch
  getUnitsByBatch: async (batchId: string): Promise<Unit[]> => {
    return mockUnits.filter(unit => unit.batchId === batchId);
  },

  // Get units by status
  getUnitsByStatus: async (status1?: Unit['status1'], status2?: Unit['status2']): Promise<Unit[]> => {
    return mockUnits.filter(unit => 
      (!status1 || unit.status1 === status1) &&
      (!status2 || unit.status2 === status2)
    );
  },

  // Update unit status
  updateUnitStatus: async (
    unitId: string,
    updates: {
      status1?: Unit['status1'];
      status2?: Unit['status2'];
      location?: string;
      orderId?: string;
    }
  ): Promise<Unit> => {
    const unitIndex = mockUnits.findIndex(unit => unit.id === unitId);
    if (unitIndex === -1) {
      throw new Error('Unit not found');
    }

    mockUnits[unitIndex] = {
      ...mockUnits[unitIndex],
      ...updates
    };

    return mockUnits[unitIndex];
  }
}; 