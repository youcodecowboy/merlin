# Production Request Acceptance Flow

## Overview
When a production request is accepted, it triggers a series of automated actions that create and manage inventory items based on the request quantity and waitlist entries.

## Detailed Flow

1. **Accept Production Request**
   - Change production request status from `PENDING` to `ACTIVE`
   - Create a new batch ID for this production run
   - Record timestamp of acceptance

2. **Create Inventory Items**
   - Generate `n` items where `n` = production request quantity
   - For each item:
     - Generate unique QR code
     - Set initial status1 to `UNCOMMITTED`
     - Set initial status2 to `CREATED`
     - Set style, waist, length, shape, wash based on production request SKU
     - Associate with the newly created batch ID

3. **Process Waitlist**
   - Get all waitlist entries for this production request, ordered by position
   - For each waitlist entry:
     - Find an `UNCOMMITTED` item from the batch
     - Change item status1 to `COMMITTED`
     - Associate item with the order (through status tracking)
     - Update order status to reflect item assignment

4. **Example Scenario**
   ```
   Production Request:
   - SKU: SLIM-DARK-32-32
   - Quantity: 10
   - Waitlist: 2 orders

   Actions:
   1. Create 10 items with status1=UNCOMMITTED
   2. Find first waitlist entry → Commit 1 item
   3. Find second waitlist entry → Commit 1 item
   4. Leave remaining 8 items as UNCOMMITTED for future orders
   ```

## Database State Changes

### Before Acceptance
```
ProductionRequest:
- status: PENDING
- quantity: 10

No Items exist yet

Waitlist:
- Order A (position 1)
- Order B (position 2)
```

### After Acceptance
```
ProductionRequest:
- status: ACTIVE
- quantity: 10

Items (10 total):
- 2 items: status1=COMMITTED (assigned to waitlisted orders)
- 8 items: status1=UNCOMMITTED (available for future orders)

Waitlist: (unchanged, maintains history)
- Order A (position 1)
- Order B (position 2)
```

## Error Handling
- Validate production request exists and is in PENDING state
- Ensure SKU format is valid
- Verify quantity is positive
- Check for duplicate QR codes
- Handle concurrent access to inventory items
- Maintain transaction integrity across all state changes 