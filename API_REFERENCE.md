# Core Functions API Reference

## SKU Management
```typescript
// Parse SKU into components
parseSKU(sku: string): { 
  style: string; 
  waist: number; 
  shape: string; 
  inseam: number; 
  wash: string; 
} | null

// Build SKU from components
buildSKU(components: { 
  style: string; 
  waist: number; 
  shape: string; 
  inseam: number; 
  wash: string; 
}): string

// Calculate hem adjustment
getHemAdjustment(hem: 'RWH' | 'STH' | 'ORL' | 'HRL'): number
```

## Orders
```typescript
// Get all orders with customer and items
getOrders(): Promise<Order[]>

// Get next sequential order number
getNextOrderNumber(): Promise<number>

// Create new order
createOrder(data: {
  customer_id: string;
  number: number;
  order_status: string;
  items: OrderItem[];
}): Promise<Order>
```

## Customers
```typescript
// Get all customers
getCustomers(): Promise<Customer[]>

// Create new customer
createCustomer(data: {
  email: string;
  name?: string;
  phone?: string;
}): Promise<Customer>
```

## Products
```typescript
// Get all products
getProducts(): Promise<Product[]>
```

## Production Management
```typescript
// Get pending production requests
getPendingProduction(): Promise<PendingProduction[]>

// Create pending production request
createPendingProduction(data: {
  sku: string;
  quantity: number;
  priority: string;
  notes?: string;
}): Promise<PendingProduction>

// Accept production request and create batch
acceptProductionRequest(id: string, data: {
  sku: string;
  quantity: number;
}): Promise<void>

// Get active production items
getActiveProduction(): Promise<ProductionRequest[]>

// Move production item to next stage
moveToNextStage(id: string): Promise<string>
```

## Batches
```typescript
// Get batches with pagination and sorting
getBatches(params: {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}): Promise<{ items: Batch[]; total: number }>

// Get batch details with QR codes
getBatchDetails(id: string): Promise<{
  batch: Batch & { qr_codes: string[] };
  items: InventoryItem[];
}>

// Update batch status
updateBatchStatus(id: string, status: 'COMPLETED'): Promise<void>
```

## Inventory
```typescript
// Get inventory items with filtering and pagination
getInventoryItems(params: {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  status1?: string;
  status2?: string;
  search?: string;
}): Promise<{ items: InventoryItem[]; total: number }>

// Get single inventory item
getInventoryItem(id: string): Promise<InventoryItem>

// Add inventory items with QR codes
addInventoryItems(data: {
  product_id?: string;
  sku: string;
  quantity: number;
  status1: string;
  status2: string;
}): Promise<InventoryItem[]>

// Update inventory item
updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem>

// Delete inventory item
deleteInventoryItem(id: string): Promise<void>
```

## Events
```typescript
// Get inventory events
getInventoryEvents(itemId: string): Promise<InventoryEvent[]>

// Log QR code download event
logQRCodeDownload(itemId: string, item: InventoryItem): Promise<void>
```

## CRITICAL RULES

1. When modifying `core-functions.ts`:
   - ALWAYS include ALL functions listed in this reference
   - NEVER remove any function without explicit confirmation
   - Maintain consistent error handling across all functions
   - Keep function signatures exactly as documented

2. When adding new functions:
   - Add them to this reference document
   - Follow the established patterns for error handling
   - Include proper TypeScript types
   - Document the new functionality

3. When refactoring:
   - Cross-reference this document to ensure no functions are missed
   - Maintain backward compatibility
   - Update this reference if signatures change
   - Test all functions after refactoring

4. Dependencies:
   - All functions depend on the Supabase client
   - QR code functions require the `qrcode` package
   - Maintain proper imports and exports

5. Error Handling:
   - All functions should throw errors for proper handling
   - Include error logging
   - Maintain consistent error message format

This reference must be consulted whenever modifying the core API functionality to ensure consistency and completeness.