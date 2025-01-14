export interface TargetSku {
  style: string;
  waist: number;
  shape: string;
  length: number;
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
  style: string;
  waist: number;
  length: number;
  shape: string;
  wash: string;
  quantity: number;
  status: string;
  daysSinceCreated: number;
  requestedDate: string;
  waitlistedOrders: WaitlistedOrder[];
}

export interface ActiveProduction extends ProductionRequest {
  completedQuantity: number;
  startTime: string;
  estimatedCompletion: string;
} 