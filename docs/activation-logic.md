# Item Activation Logic

## Overview
The item activation process is the initial step that brings an item into the workflow system. This document explains how items are activated and the different paths they can take.

## Activation Process

### Trigger Points
1. **Manual Activation**: Through the "Update Status" button
2. **QR Code Scan**: By scanning the item's QR code
3. **Production Completion**: When an item completes production

### Logic Flow

1. **Initial State Check**
   - If item has no scan events or status is 'STOCK'
   - System presents "Activate Item" as the current workflow step

2. **Commitment Status**
   - If `status1 === 'COMMITTED'`:
     - Item is activated and sent to washing (WASH_QUEUE)
   - If not committed:
     - Item is activated and sent to storage (STORAGE_QUEUE)

3. **Location Tracking**
   - Each activation records the current location
   - Default location for manual activation is 'STAGING'

## Implementation Details

### API Endpoint
- POST `/api/items/status`
- Payload includes:
  ```json
  {
    "itemId": "string",
    "scanType": "ACTIVATION",
    "location": "string" (optional)
  }
  ```

### Scan Event Recording
- Creates a new scan event with:
  - `type: "ACTIVATION"`
  - `success: true`
  - `location`: Current location
  - `timestamp`: Current time

### Status Updates
- Updates `status2` based on commitment:
  - WASH_QUEUE or STORAGE_QUEUE
- Records location change
- Triggers appropriate workflow step updates

## Error Handling
- Validates QR code matches item ID
- Prevents duplicate activations
- Records failed attempts in scan history
- Provides user feedback through toast notifications 