# Production Unit Creation Process

## Overview
This document outlines the process of creating individual units when a production request is accepted. It covers the unit creation, ID generation, status assignment, and waitlist processing.

## Production Request Acceptance

### Trigger Events
- Manual acceptance of pending production request
- Approval of quantity and SKU specifications
- Confirmation of production capacity

### Initial Data Required
1. **Production Request Details**
   - Universal SKU (e.g., ST-32-X-36-RAW)
   - Requested quantity
   - Priority level
   - Target completion date

2. **Waitlist Information**
   - Number of waitlisted orders for SKU
   - Order priority/FIFO sequence
   - Target SKU requirements

## Unit Creation Process

### 1. Batch Creation
- Generate unique batch ID
- Link to original production request
- Record timestamp and operator
- Store target completion dates

### 2. Individual Unit Generation
For each unit in the requested quantity:

1. **Generate Unique Identifiers**
   - Create unique unit ID (format: UNIT-[TIMESTAMP]-[SEQUENCE])
   - Generate QR code containing:
     * Unit ID
     * Universal SKU
     * Batch ID
     * Production date
     * Version/checksum

2. **Set Initial Status**
   - STATUS1: UNCOMMITTED (default)
   - STATUS2: PRODUCTION
   - Location: Production floor
   - Created timestamp
   - Batch association

3. **Process Waitlist Assignment**
   - Check waitlist for matching SKU requirements
   - If waitlisted orders exist:
     * Change STATUS1 to COMMITTED
     * Link to waitlisted order
     * Maintain FIFO order
   - If no waitlist:
     * Maintain STATUS1 as UNCOMMITTED

### Example Scenario
```
Production Request:
- SKU: ST-32-X-36-RAW
- Quantity: 10 units
- Waitlist: 8 orders

Result:
- 10 units created
- 8 units: STATUS1 = COMMITTED (linked to waitlist)
- 2 units: STATUS1 = UNCOMMITTED
- All units: STATUS2 = PRODUCTION
```

## Batch Tracking

### Batch Information
- Total quantity
- Number of committed units
- Number of uncommitted units
- Target completion date
- Current completion percentage

### Unit Grouping
- All units in batch share:
  * Same universal SKU
  * Same production timeline
  * Same batch ID
  * Same production priority

## Status Management

### Initial Status Assignment
1. **All Units Start As**:
   - STATUS1: UNCOMMITTED
   - STATUS2: PRODUCTION

2. **Immediate Waitlist Processing**:
   - System checks waitlist
   - Updates STATUS1 to COMMITTED for matched orders
   - Maintains FIFO order for waitlist

### Status Tracking
- Track status changes per unit
- Maintain batch-level status overview
- Update completion percentage
- Monitor production timeline

## QR Code Generation

### QR Code Content
1. **Required Information**:
   - Unit ID (primary identifier)
   - Universal SKU
   - Batch ID
   - Production timestamp
   - Version number

2. **Format**:
   ```json
   {
     "unitId": "UNIT-20240110-001",
     "sku": "ST-32-X-36-RAW",
     "batchId": "BATCH-20240110-001",
     "created": "2024-01-10T10:00:00Z",
     "version": "1.0"
   }
   ```

### QR Code Usage
- Unique per unit
- Scannable for status updates
- Links to unit details
- Enables location tracking

## Waitlist Processing

### Order Priority
1. Check waitlist for SKU matches
2. Process in FIFO order
3. Assign units to orders
4. Update STATUS1 accordingly

### Partial Fulfillment
- If waitlist quantity < production quantity:
  * Assign available units to waitlist
  * Leave remaining units as UNCOMMITTED
  * Enable future assignment

## System Updates

### Database Records
1. **Unit Records**:
   - Create individual unit entries
   - Set initial status values
   - Link to batch
   - Store QR data

2. **Batch Records**:
   - Create batch entry
   - Link all units
   - Track completion

3. **Waitlist Updates**:
   - Update order status
   - Link committed units
   - Maintain queue position

### Location Tracking
- Initial location assignment
- Enable movement tracking
- QR code scanning points
- Production area mapping

## Success Criteria

### Unit Creation
- All units created successfully
- Unique IDs generated
- QR codes validated
- Initial status set

### Waitlist Processing
- Correct number of units committed
- FIFO order maintained
- Order links established
- Remaining units properly uncommitted

### Batch Management
- Batch properly created
- All units linked
- Production tracking enabled
- Timeline established

## Monitoring and Validation

### Key Metrics
1. **Creation Success Rate**
   - Units successfully created
   - QR codes generated
   - Status assignments completed

2. **Waitlist Efficiency**
   - Time to process waitlist
   - Accuracy of assignments
   - FIFO maintenance

3. **Batch Tracking**
   - Production progress
   - Unit status distribution
   - Timeline adherence

### Error Handling
- Duplicate ID prevention
- Failed QR generation recovery
- Status assignment verification
- Waitlist processing validation 