# Schema Rework Documentation

## Current Schema Models and Proposed Changes

### Order Model
```prisma
model Order {
  id           String      @id @default(uuid())
  customerId   String?
  targetStyle  String
  targetWaist  Int
  targetLength Int
  targetShape  String
  targetWash   String
  buttonColor  String
  hemType      String
  nameTag      String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  customer     Customer?   @relation(fields: [customerId], references: [id])
  waitlistEntries Waitlist[]
  items        Item[]
}
```

### Item Model
```prisma
model Item {
  id        String      @id @default(uuid())
  qrCode    String      @unique
  style     String
  waist     Int
  length    Int
  shape     String
  wash      String
  fabric    String      @default("13")
  status1   String      // Ownership: UNCOMMITTED, COMMITTED, ASSIGNED
  status2   String      // Production stage
  location  String?
  batchId   String?
  orderId   String?
  assignedBinId String?
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  scanEvents ScanEvent[]
  order     Order?      @relation(fields: [orderId], references: [id])
  assignedBin Bin?      @relation("BinToItems", fields: [assignedBinId], references: [id])
  productionRequest ProductionRequest? @relation(fields: [productionRequestId], references: [id])
  productionRequestId String?
  batch     Batch?     @relation(fields: [batchId], references: [id])
}
```

### Customer Model
```prisma
model Customer {
  id        String   @id @default(uuid())
  name      String
  email     String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]
}
```

### ProductionRequest Model
```prisma
model ProductionRequest {
  id        String    @id @default(uuid())
  style     String
  waist     Int
  length    Int
  shape     String
  wash      String
  quantity  Int
  status    String    @default("PENDING")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  waitlist  Waitlist[]
  items     Item[]
  batch     Batch?    @relation("BatchToProductionRequest")
}
```

## Key Changes

1. **Order Model Simplification**
   - Remove `status1` and `status2` fields from Order
   - Order status is now determined by its associated Item's status
   - This simplifies the data model and removes potential status synchronization issues

2. **Preserved Functionality**
   - SKU search remains unchanged
   - Activation process remains unchanged
   - Waitlist functionality remains unchanged
   - Production request creation remains unchanged

## API Endpoints Impact

### Order Endpoints That Need Updates
- `/api/orders`
  - GET: Update to return item status instead of order status
  - POST: Remove status field from creation
- `/api/orders/[id]`
  - GET: Update to return item status instead of order status
- `/api/test/create-one-order`
  - POST: Remove status field from creation
- `/api/test/order-scenarios`
  - POST: Update test scenarios to work with item status

### Endpoints That Don't Need Changes
- All `/api/items/*` endpoints
- All `/api/production/*` endpoints
- All `/api/customers/*` endpoints

## Migration Plan

1. Create a new migration to:
   - Remove `status1` and `status2` fields from Order model
   - Ensure all existing orders have associated items

2. Update API endpoints to:
   - Remove status field from order creation
   - Use item status when returning order information
   - Update test endpoints to reflect new schema

3. No changes needed for:
   - SKU search logic
   - Activation process
   - Waitlist management
   - Production request creation

## Testing Strategy

1. Verify core flows remain unchanged:
   - SKU search functionality
   - Item activation process
   - Waitlist management
   - Production request creation

2. Test order-related functionality:
   - Order creation (without status)
   - Order status display (via item status)
   - Order listing and filtering 

## Current Issues (As of Latest Changes)

### Schema and Migration Issues
1. **Status Field Inconsistencies**
   - Mix of string-based and enum-based status fields causing type conflicts
   - Order model has conflicting status field definitions
   - Item model using enums but API expecting strings
   - Migration conflicts between old string-based status and new enum types

2. **API Endpoint Mismatches**
   - Order creation endpoints using incorrect status field names
   - ScanEvent queries referencing non-existent timestamp field
   - ProductionRequest creation requiring manual updatedAt field

### Proposed Resolution Steps
1. **Schema Cleanup**
   - Decide on consistent approach: either all string-based or all enum-based status fields
   - Remove duplicate/conflicting status fields from Order model
   - Align Item model status fields with API expectations

2. **Migration Reset**
   - Consider resetting migrations to resolve conflicts
   - Ensure all models use consistent field types
   - Remove any conflicting enum definitions

3. **API Alignment**
   - Update all endpoints to use correct status field names
   - Add missing fields to ScanEvent model
   - Ensure ProductionRequest handles timestamps automatically

4. **Testing Strategy**
   - Verify each endpoint after schema changes
   - Test all status transitions
   - Validate enum constraints if kept
   - Ensure no regression in core functionality 