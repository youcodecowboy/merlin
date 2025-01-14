# Stage 1: SKU Matching and Inventory Assignment Logic

## Overview
Stage 1 defines the fundamental SKU search and inventory assignment logic that forms the backbone of our order processing system. This stage ensures accurate SKU matching and proper handling of both production and stock inventory.

## Status Definitions

### STATUS1 (Assignment Status)
Tracks the assignment state of each unit:

1. **UNCOMMITTED**
   - Default state for new units
   - Unit is not assigned to any order
   - Available for assignment or waitlist
   - Can transition to COMMITTED or ASSIGNED

2. **COMMITTED**
   - Soft assignment to an order
   - Unit is in production and promised to a waitlisted order
   - Cannot be assigned to other orders
   - Transitions to ASSIGNED when production completes

3. **ASSIGNED**
   - Hard assignment to specific order
   - Direct link between unit ID and order ID
   - Final assignment state
   - Triggers next production stage

### STATUS2 (Production Stage)
Tracks the unit's position in the production process:

1. **PRODUCTION**
   - Unit is in initial production stage
   - Not yet ready for washing or finishing
   - First stage after activation

2. **WASH_QUEUE**
   - Unit is waiting to be added to wash bin
   - Temporary state between production and washing
   - Requires bin assignment

3. **WASHING**
   - Unit is in wash bin
   - Actively being processed for washing
   - Tracks specific wash bin location

4. **LAUNDRY**
   - Unit is at laundry facility
   - Being processed by external laundry
   - Waiting for return to facility

5. **QC**
   - Unit is in quality control
   - Being inspected for defects
   - Measurements being verified

6. **FINISHING**
   - Unit is in finishing process
   - Includes hemming, buttons, tags
   - Following order specifications

7. **PACKING**
   - Unit is being prepared for shipping
   - Final quality check
   - Packaging according to specifications

8. **SHIPPING**
   - Unit is ready for shipment
   - In shipping area
   - Awaiting pickup

9. **FULFILLED**
   - Unit has been shipped
   - Order complete
   - Final state

## SKU Search Process

### 1. Exact SKU Match
- **Primary Search**
  - Search for exact SKU match first (e.g., "ST-32-X-32-IND")
  - Must match all components:
    - Style (ST) - Immovable
    - Waist (32) - Immovable
    - Shape (X) - Immovable
    - Length (32)
    - Wash (IND)
  - **Critical Requirement**: Units MUST be STATUS1 = UNCOMMITTED
  - If no UNCOMMITTED units found, exact match fails and moves to Universal Search

### 2. Universal SKU Fallback
- **Secondary Search**
  - Only triggered if no UNCOMMITTED exact match found
  - Search for universal SKU with following rules:
    - Style (ST) - Must match exactly
    - Waist (32) - Must match exactly
    - Shape (X) - Must match exactly
    - Length - Current SKU length must be GREATER than or EQUAL to target length
    - Wash - Must be RAW or BRW (universal wash codes)
  - **Critical Requirement**: Units MUST be STATUS1 = UNCOMMITTED
  - If no UNCOMMITTED units found, order moves to pending production

### Wash Code Mapping

#### Light Wash Group
- **Target Washes**: 
  - STA (Standard)
  - IND (Indigo)
- **Universal Wash**: 
  - RAW (Raw Denim)
  - Used for all light wash transformations

#### Dark Wash Group
- **Target Washes**:
  - ONX (Onyx)
  - JAG (Jaguar)
- **Universal Wash**:
  - BRW (Black Raw)
  - Used for all dark wash transformations

## Status Transition Rules

### STATUS1 Transitions
1. **UNCOMMITTED → COMMITTED**
   - Triggered by waitlist assignment
   - Unit remains in production
   - Order is added to waitlist

2. **UNCOMMITTED → ASSIGNED**
   - Triggered by direct assignment
   - Unit is ready for next stage
   - Creates direct unit-order link

3. **COMMITTED → ASSIGNED**
   - Triggered when production complete
   - Unit ready for order processing
   - Maintains original order link

### STATUS2 Transitions
1. **PRODUCTION → WASH_QUEUE**
   - Production complete
   - Ready for wash assignment

2. **WASH_QUEUE → WASHING**
   - Wash bin assigned
   - Location updated

3. **WASHING → LAUNDRY**
   - Bin scanned out
   - At external facility

4. **LAUNDRY → QC**
   - Returned from laundry
   - Ready for inspection

5. **QC → FINISHING**
   - Passed quality control
   - Ready for finishing steps

6. **FINISHING → PACKING**
   - Finishing steps complete
   - Ready for final packaging

7. **PACKING → SHIPPING**
   - Packaging complete
   - Ready for shipment

8. **SHIPPING → FULFILLED**
   - Order shipped
   - Process complete

## Assignment Logic

### For Production Units (STATUS2 = PRODUCTION)
When matching units are found in production:
1. Set STATUS1 to COMMITTED
2. Add order to waitlist for that specific SKU
3. Order remains in waitlist until production complete
4. Commitment is at SKU level (soft commitment)

### For Available Units (STATUS2 ≠ PRODUCTION)
When matching UNCOMMITTED units are found:
1. Set STATUS1 to ASSIGNED
2. Create hard assignment linking specific unit ID to order ID
3. Update STATUS2 based on next required process
4. Generate appropriate process request

## Waitlist Processing
- When units complete production:
  1. System checks waitlist for that SKU
  2. Assigns units to orders in waitlist order (FIFO)
  3. Changes STATUS1 from COMMITTED to ASSIGNED
  4. Updates STATUS2 based on next required process

### Pending Production Logic
- **Trigger**: No UNCOMMITTED units found in either:
  1. Exact SKU match search
  2. Universal SKU match search

- **Process**:
  1. System creates a pending production request for the UNIVERSAL SKU
     - For light washes (STA/IND): Creates request for RAW
     - For dark washes (ONX/JAG): Creates request for BRW
     - Must match Style/Waist/Shape
     - Uses universal length (36")
  
  2. System checks for existing pending production requests
     - If pending request exists for same universal SKU:
       * Increment quantity needed
       * Add order to existing request's waitlist
     - If no pending request exists:
       * Create new pending production request for universal SKU
       * Start new waitlist with this order

  3. Production Request Priority
     - Priority based on oldest order in waitlist
     - Multiple requests for same universal SKU are consolidated
     - System maintains FIFO order within each SKU's waitlist

  4. Production Request Acceptance
     - Manual acceptance of pending production requests
     - Upon acceptance, system automatically:
       * Creates individual inventory items for requested quantity
       * Generates unique item ID and QR code for each unit
       * Sets initial status: STATUS1 = PRODUCTION, STATUS2 = UNCOMMITTED
       * Creates new production batch containing all accepted units
       * Generates consolidated QR codes for batch tracking
       * Creates pattern request for the universal SKU and quantity
       * Adds universal SKU and quantity to pattern requests table

  5. Waitlist Processing on Acceptance
     - System checks waitlist quantity for the SKU
     - For each unit created:
       * If waitlisted orders exist: STATUS2 changes to COMMITTED
       * If no waitlisted orders: STATUS2 remains UNCOMMITTED
     - Example:
       * 20 units of RAW accepted for production
       * 10 orders in waitlist (mix of STA/IND)
       * Result: 10 units STATUS2 = COMMITTED, 10 units STATUS2 = UNCOMMITTED

## Key Rules
1. **Immovable Components**
   - Style code must always match exactly
   - Waist size must always match exactly
   - Shape must always match exactly

2. **Flexible Components**
   - Length: Current SKU length must be >= target length
   - Wash: Follows wash group mapping rules

3. **Status Transitions**
   - PRODUCTION → STOCK (STATUS1) triggers waitlist processing
   - COMMITTED → ASSIGNED (STATUS2) occurs during unit assignment

## Transaction Integrity
- All status changes must be atomic
- Waitlist processing must maintain FIFO order
- Status changes must be logged for audit purposes

## Success Criteria
- Accurate SKU matching
- Proper status assignment
- Correct waitlist management
- Accurate wash request creation
- Maintained FIFO order for waitlist processing

## Monitoring
- Track status transitions
- Monitor waitlist length per SKU
- Track wash request creation and completion
- Monitor production to stock conversion rates

### Production Flow

#### Pattern Request Processing
- **Trigger**: Production request acceptance creates pattern request
- **Pattern Maker Interface**:
  - Displays all pending pattern requests
  - Allows grouping of multiple SKUs into single cutting request
  - Pattern maker can consolidate similar styles/sizes for efficiency

#### Cutting Process
1. **Pattern Grouping**
   - Pattern maker manually groups compatible SKUs
   - Creates consolidated cutting request
   - System notifies cutting team for pattern pickup
   - Location set to pattern maker office

2. **Cutting Completion**
   - Cutting team marks request as COMPLETE
   - System automatically:
     * Updates items to STATUS1 = PRODUCTION
     * Adds subtype tag "SEWING"
     * Moves to sewing stage

#### Warehouse Arrival and QR Activation
- **First Scan Activation**
  - Critical moment: First QR scan activates item in system
  - Triggers automatic assignment logic:

  1. **With Waitlisted Orders**:
     - System immediately:
       * Assigns item to oldest waitlisted order (position #1)
       * Changes STATUS2 from COMMITTED to ASSIGNED
       * Generates wash request
       * Guides staff through wash bin placement

  2. **Without Waitlisted Orders**:
     - System automatically:
       * Generates storage MOVE REQUEST
       * Calculates optimal bin location based on:
         * Available space
         * Proximity
         * SKU type
       * Guides staff through storage process:
         1. Display target bin location
         2. Require bin QR scan
         3. Confirm item placement

#### Move Request Process
- **Purpose**: Ensure strategic storage of non-waitlisted items
- **Bin Assignment Algorithm**:
  1. **Single SKU Bin Priority**
     - First, search for existing bins containing same SKU
     - If found and has capacity:
       * Assign to this bin to maintain SKU grouping
       * Update bin capacity count

  2. **Empty Bin Search**
     - If no existing bin for SKU or all are full:
       * Search for completely empty bins
       * Prioritize creating new single-SKU bin
       * Reserve entire bin capacity for same SKU

  3. **Mixed SKU Fallback**
     - Only if no single-SKU or empty bins available:
       * Search for bins with available capacity
       * Prioritize bins with most available space
       * Flag bin as mixed-SKU for future reference

  Example:
  - Given: 5 bins of 10 unit capacity
  - Scenario 1:
    * SKU1 arrives: Placed in empty Bin1
    * Another SKU1 arrives: Added to Bin1
    * SKU2 arrives: Placed in empty Bin2 (not mixed with SKU1)
  
  - Scenario 2:
    * All bins contain items
    * Bin1: 8 units of SKU1 (2 spaces free)
    * New SKU1 arrives: Added to Bin1 despite other bins having more space
    * Maintains single-SKU grouping

- **Steps**:
  1. System calculates optimal bin using above algorithm
  2. Displays target bin location to staff
  3. Staff transports item to location
  4. Staff scans bin QR code
  5. Staff confirms placement
  - System updates:
    * Item location to assigned bin
    * Bin capacity/availability
    * Bin SKU grouping status
    * Item status to STOCK/UNCOMMITTED

## Summary of Key Concepts

### Critical Processes
1. **SKU Matching Hierarchy**
   - Exact match (UNCOMMITTED only)
   - Universal match (UNCOMMITTED only)
   - Length must be >= target
   - Wash groups (Light: RAW for STA/IND, Dark: BRW for ONX/JAG)

2. **Status Management**
   - STATUS1: PRODUCTION → STOCK → WASH
   - STATUS2: UNCOMMITTED → COMMITTED → ASSIGNED

3. **Production Flow**
   - Always create universal SKU production requests
   - Pattern → Cutting → Sewing → Warehouse
   - First QR scan activation is critical decision point

4. **Storage Logic**
   - Prioritize single-SKU bins
   - Minimize mixed SKU storage
   - Strategic bin assignment

## Event Logging Requirements

### Order Events
- **Order Creation**
  - Timestamp
  - Order ID
  - Target SKU
  - Customer details
  - Source/channel

- **SKU Search**
  - Search timestamp
  - Target SKU
  - Search type (exact/universal)
  - Results found/not found
  - Matching SKUs if found

### Inventory Assignment Events
- **Unit Assignment**
  - Assignment timestamp
  - Unit ID
  - Order ID
  - Assignment type (direct/universal)
  - Previous status
  - New status

### Production Events
- **Production Request**
  - Request timestamp
  - Universal SKU
  - Quantity needed
  - Waitlist position
  - Source order IDs

- **Pattern/Cutting**
  - Pattern request creation
  - Pattern grouping details
  - Cutting start/completion
  - Batch ID
  - Operator ID

### Location Events
- **Move Requests**
  - Request timestamp
  - Unit ID
  - Source location
  - Target location
  - Operator ID
  - Completion time

- **Bin Management**
  - Bin capacity changes
  - SKU mixing events
  - Bin status updates

### Status Change Events
- **STATUS1 Changes**
  - Previous status
  - New status
  - Timestamp
  - Trigger event
  - Related order/request IDs

- **STATUS2 Changes**
  - Previous status
  - New status
  - Timestamp
  - Trigger event
  - Related order/request IDs

### QR Code Events
- **Generation**
  - Creation timestamp
  - Associated SKU
  - Batch ID
  - Production request ID

- **Activation**
  - First scan timestamp
  - Location
  - Operator ID
  - Resulting action (wash/move request)

### Wash Request Events
- **Creation**
  - Request timestamp
  - Unit ID
  - Target wash
  - Order ID

- **Step Completion**
  - Step number
  - Completion timestamp
  - Operator ID
  - Location updates
  - Status changes

All events should include:
- Event ID
- Event type
- Timestamp
- Actor (system/user ID)
- Related IDs (order, unit, batch, etc.)
- Previous state
- New state
- Additional context metadata