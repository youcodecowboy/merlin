# Bin Assignment Test Scenario

## Test Case: Uncommitted Item Assignment to Storage Bin

### Initial Setup
1. Create a storage bin in Zone 1 for storing uncommitted items
2. Create a test order for 1 unit
3. Create and accept a production request for 2 units (1 extra uncommitted unit)
4. Verify the batch is created with 2 items
5. Scan the QR code of the uncommitted item

### Expected Behavior
1. When scanning an uncommitted item's QR code:
   - The item should be assigned to an available storage bin
   - The item's status1 should change to "STORAGE"
   - The bin's currentCount should increment
   - The item should appear in the bin's items list

### Test Steps
1. Create Storage Bin:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
   -d '{"type":"ZONE1","capacity":"10","sku":"ZONE1-10"}' \
   http://localhost:3001/api/storage
   ```

2. Create Test Order:
   ```bash
   curl -X POST http://localhost:3001/api/test/create-one-order
   ```

3. Accept Production Request:
   ```bash
   # Use the production request ID from step 2
   curl -X POST -H "Content-Type: application/json" \
   -d '{"requestId":"PRODUCTION_REQUEST_ID","action":"accept"}' \
   http://localhost:3001/api/production
   ```

4. Scan QR Code:
   ```bash
   # Use the QR code of the uncommitted item
   curl -X POST -H "Content-Type: application/json" \
   -d '{"qrCode":"QR_CODE","location":"STORAGE"}' \
   http://localhost:3001/api/scan
   ```

### Verification Steps
1. Check storage bin status:
   ```bash
   curl http://localhost:3001/api/storage
   ```

2. Check item status:
   ```bash
   curl http://localhost:3001/api/items/ITEM_ID
   ```

### Success Criteria
- The item should be visible in the storage bin's items list
- The item's status1 should be "STORAGE"
- The storage bin's currentCount should be incremented
- The item should be linked to the storage bin via batchId 