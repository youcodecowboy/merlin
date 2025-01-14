# Post-Activation Unit Processing

## Overview
This document outlines the workflow that occurs after units are activated in production, detailing how committed and uncommitted units are processed differently, including wash request generation and storage handling.

## Activation Trigger
- Unit QR code scanned for activation
- Production stage completed
- Quality checks passed
- Ready for next stage processing

## COMMITTED Units Flow

### 1. Order Assignment
- System identifies unit's STATUS1 as COMMITTED
- Retrieves associated waitlist order (FIFO order)
- Creates permanent link between unit and order
- Changes STATUS1 from COMMITTED to ASSIGNED

### 2. Wash Request Generation
- System compares:
  * Unit's current SKU (Universal: RAW or BRW)
  * Order's target SKU wash code
- Determines appropriate wash process
- Creates wash request with specific parameters

### Example Scenarios

#### Light Wash Path
```
Unit SKU: ST-32-X-32-RAW (Universal)
Order SKU: ST-32-X-32-STA (Target)
Result: Generate STA wash request
```

#### Dark Wash Path
```
Unit SKU: ST-32-X-32-BRW (Universal)
Order SKU: ST-32-X-32-ONX (Target)
Result: Generate ONX wash request
```

### 3. Status Updates
- STATUS1: COMMITTED → ASSIGNED
- STATUS2: PRODUCTION → WASH_QUEUE
- Location: Updated to wash staging area
- Wash request status: PENDING

## UNCOMMITTED Units Flow

### 1. Stock Processing
- System identifies unit's STATUS1 as UNCOMMITTED
- Changes STATUS1 to STOCK
- No order association required

### 2. Storage Request Generation
- Creates storage request for unit
- Assigns to appropriate storage area based on:
  * SKU type
  * Universal wash code
  * Available bin capacity
- Sets location status to PENDING_STORAGE

### 3. Status Updates
- STATUS1: UNCOMMITTED → STOCK
- STATUS2: PRODUCTION → STORAGE_QUEUE
- Location: Updated to storage staging area
- Storage request status: PENDING

## Wash Request Details

### Request Components
1. **Unit Information**
   - Unit ID
   - Current SKU
   - Target SKU
   - Order reference (if ASSIGNED)

2. **Wash Specifications**
   - Wash code (e.g., STA, IND, ONX)
   - Process requirements
   - Quality parameters

3. **Tracking Data**
   - Request ID
   - Timestamp
   - Priority level
   - Target completion time

## Storage Request Details

### Request Components
1. **Unit Information**
   - Unit ID
   - Universal SKU
   - Batch reference
   - Stock status

2. **Storage Specifications**
   - Storage area code
   - Bin type
   - Capacity requirements
   - Access priority

3. **Tracking Data**
   - Request ID
   - Timestamp
   - Storage duration estimate
   - Retrieval priority

## System Updates

### Database Records
1. **Unit Updates**:
   - Status changes
   - Location updates
   - Order associations (if ASSIGNED)
   - Request linkages

2. **Order Updates**:
   - Unit assignments
   - Waitlist position updates
   - Timeline adjustments

3. **Request Creation**:
   - Wash requests
   - Storage requests
   - Movement tracking

## Validation Rules

### For COMMITTED Units
- Must have valid waitlist order
- Order SKU must match unit capabilities
- Wash type must be valid for universal SKU
- Location must be valid for next stage

### For UNCOMMITTED Units
- Must have valid universal SKU
- Storage area must have capacity
- Location must be valid for storage
- No pending orders/requests

## Error Handling

### Common Scenarios
1. **Invalid Wash Request**
   - Universal SKU doesn't support target wash
   - Invalid wash code specified
   - Missing wash parameters

2. **Storage Conflicts**
   - No available storage space
   - Invalid bin assignment
   - Location conflicts

3. **Status Conflicts**
   - Invalid status transitions
   - Missing order references
   - Location inconsistencies

### Recovery Procedures
- Automatic retry logic
- Manual intervention triggers
- Status rollback capabilities
- Notification system

## Success Criteria

### For COMMITTED Units
- Successfully assigned to order
- Valid wash request created
- Correct status transitions
- Location properly updated

### For UNCOMMITTED Units
- Successfully marked as stock
- Valid storage request created
- Correct status transitions
- Location properly updated

## Monitoring

### Key Metrics
1. **Processing Time**
   - Activation to request creation
   - Request to completion
   - Overall processing time

2. **Success Rates**
   - Successful assignments
   - Valid request creation
   - Error frequency

3. **Capacity Tracking**
   - Wash queue length
   - Storage utilization
   - Processing bottlenecks 