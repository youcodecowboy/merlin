# Bin Assignment Logic

## Overview
The bin assignment system automatically assigns storage bins to items and verifies correct placement through QR code scanning. This document explains the bin assignment process and verification workflow.

## Assignment Process

### Trigger Points
1. When an item enters STORAGE_QUEUE status
2. Manual refresh through the refresh button
3. After failed bin confirmation attempts

### Assignment Logic

1. **Bin Selection Criteria**
   - Type must be 'STORAGE'
   - Current count must be less than capacity
   - Ordered by current count (ascending) to optimize space usage

2. **Assignment States**
   - **Searching**: System displays animated checking indicators
   - **Found**: Shows assigned bin details (code, location, capacity)
   - **Confirmed**: After successful bin QR scan

### Visual Feedback

The UI shows three key pieces of information:
1. **Bin Code**: The unique QR identifier
2. **Location**: Physical location identifier
3. **Capacity**: Available space confirmation

## Implementation Details

### API Endpoints

1. **Bin Assignment**
   - POST `/api/items/status`
   - Payload:
     ```json
     {
       "itemId": "string",
       "scanType": "REFRESH_BIN_ASSIGNMENT"
     }
     ```

2. **Bin Confirmation**
   - POST `/api/items/status`
   - Payload:
     ```json
     {
       "itemId": "string",
       "scanType": "BIN_CONFIRMATION",
       "binQrCode": "string"
     }
     ```

### Scan Event Recording
- Creates events for:
  - STORAGE_ASSIGNMENT (when bin is assigned)
  - BIN_CONFIRMATION (when placement is verified)
- Records success/failure status
- Includes bin metadata (code, location)

### Database Updates
- Updates item's assigned bin
- Increments bin's current count
- Updates item location

## Error Handling

1. **Assignment Failures**
   - No available bins
   - Database connection issues
   - Records failed assignment attempts

2. **Confirmation Failures**
   - Wrong bin scanned
   - Bin capacity exceeded
   - Records failed confirmation attempts

## User Interface
- Shows real-time assignment status
- Provides clear confirmation instructions
- Allows manual refresh of assignment
- Displays assignment history in scan events 