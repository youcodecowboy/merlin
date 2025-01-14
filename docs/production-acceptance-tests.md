# Production Request Acceptance Test Scenarios

## Test Cases

### 1. Basic Acceptance Flow
- **Scenario**: Accept a production request with no waitlist
- **Input**:
  ```json
  {
    "requestId": "[PRODUCTION_REQUEST_ID]",
    "action": "accept"
  }
  ```
- **Expected Results**:
  - Production request status changes to IN_PROGRESS
  - New batch is created
  - All items created with UNCOMMITTED status
  - No items are COMMITTED (no waitlist)

### 2. Waitlist Processing
- **Scenario**: Accept a production request with waitlisted orders
- **Input**: Same as above, but with production request that has waitlist entries
- **Expected Results**:
  - Production request status changes to IN_PROGRESS
  - New batch is created
  - Items created equal to quantity
  - First N items are COMMITTED (N = number of waitlist entries)
  - Remaining items are UNCOMMITTED

### 3. Error Cases
#### 3.1 Invalid Request ID
- **Input**: Non-existent production request ID
- **Expected**: 404 error response

#### 3.2 Invalid Request Status
- **Input**: Production request that's already IN_PROGRESS
- **Expected**: 400 error response

#### 3.3 Invalid SKU Format
- **Input**: Production request with malformed SKU
- **Expected**: 400 error response

## Test Steps

1. **Setup**:
   ```sql
   -- Check current state
   SELECT * FROM "ProductionRequest" WHERE id = '[ID]';
   SELECT * FROM "Waitlist" WHERE "productionRequestId" = '[ID]';
   ```

2. **Execute**:
   ```bash
   curl -X POST http://localhost:3000/api/production \
     -H "Content-Type: application/json" \
     -d '{"requestId":"[ID]","action":"accept"}'
   ```

3. **Verify**:
   ```sql
   -- Check production request status
   SELECT status FROM "ProductionRequest" WHERE id = '[ID]';
   
   -- Check created items
   SELECT status1, status2, COUNT(*) 
   FROM "Item" 
   WHERE "batchId" LIKE 'BATCH-%' 
   GROUP BY status1, status2;
   ```

## Current Test Data
From our seed data, we have:
1. SLIM-DARK-32-32: 10 units, 2 waitlist entries
2. REGULAR-MEDIUM-34-30: 8 units, 1 waitlist entry
3. SLIM-LIGHT-30-34: 12 units, 1 waitlist entry
4. RELAXED-RAW-36-32: 6 units, 1 waitlist entry
5. SLIM-DARK-33-32: 15 units, no waitlist entries

## Expected Results Matrix

| Production Request | Total Items | COMMITTED | UNCOMMITTED |
|-------------------|-------------|-----------|-------------|
| SLIM-DARK-32-32   | 10          | 2         | 8           |
| REGULAR-MEDIUM    | 8           | 1         | 7           |
| SLIM-LIGHT        | 12          | 1         | 11          |
| RELAXED-RAW       | 6           | 1         | 5           |
| SLIM-DARK-33-32   | 15          | 0         | 15          | 