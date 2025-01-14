# Item Workflow Documentation

## Overview
This document outlines the complete workflow of an item in the system, from initial production to fulfillment, including all possible states and requests.

## QR Code States

### 1. Pre-Activation
- **Display**: "Item is still in production stages and will be activated upon completion"
- **Status**: Not activated
- **Actions**: None available until first QR scan

### 2. Initial Activation
Upon first QR scan, the system checks if the item is assigned to an order:

#### 2A. Ordered Items
1. **Triggers**: Wash Request
2. **Display**: Scanner button with instructions to scan wash bin
3. **Actions Required**: 
   - Scan wash bin QR code
   - Confirm placement
4. **After Completion**:
   - Status updates to "In wash bin awaiting wash"
   - Location updates to specified wash bin
5. **Next State**:
   - Updates to "At laundry" when wash bin is scanned out

#### 2B. Unordered Items
1. **Triggers**: Storage Request
2. **Display**: Assigned storage bin and scan prompt
3. **Actions Required**:
   - Scan storage bin QR code
   - Confirm placement
4. **After Completion**:
   - Status updates to "Awaiting order"
   - Location updates to assigned storage bin
5. **Request Area**: Empty until ordered

## Post-Wash Process

### 3. Quality Control
- **Trigger**: QR scan after laundry return
- **Location**: Updates from "Laundry" to "QC"
- **Request Type**: QC Request
- **Required Steps**:
  1. Measure item
  2. Check for defects
  3. Pass/Fail decision

#### 3A. QC Pass
1. **Triggers**: Move Request to Finishing
2. **Location**: Pre-finishing section bin
3. **Actions Required**:
   - Scan assigned bin
   - Confirm placement
4. **Next State**: Finishing Request

#### 3B. QC Fail
- **Status**: Marked as defective
- **Further processing**: Based on defect handling policy

### 4. Finishing Process
- **Trigger**: Confirmed placement in pre-finishing bin
- **Display**: Order-specific finishing steps
- **Required Steps**:
  1. Button attachment (if required)
  2. Hemming (if required)
  3. Name tag attachment (if required)
- **Completion**: Triggers move request to pre-packing area

### 5. Packing Process
- **Trigger**: Confirmed placement in pre-packing area
- **Type**: Packing Request
- **Required Steps**: Based on order specifications
- **Completion**: Triggers move request to shipping pickup area

### 6. Fulfillment
- **Trigger**: Confirmed placement in shipping pickup area
- **Final State**: "Fulfilled on [DATE]"
- **Location**: Shipping pickup area

## Request Types Summary

1. **Activation Request**
   - Initial QR code activation
   - Determines ordered vs unordered flow

2. **Wash Request**
   - For ordered items only
   - Requires wash bin scanning
   - Updates location tracking

3. **Storage Request**
   - For unordered items
   - Assigns storage location
   - Requires bin confirmation

4. **QC Request**
   - Post-wash inspection
   - Three-step verification
   - Determines next workflow

5. **Finishing Request**
   - Order-specific requirements
   - Multiple step completion
   - Location confirmation

6. **Packing Request**
   - Final product preparation
   - Order-specific requirements
   - Shipping preparation

7. **Move Requests**
   - Between each major stage
   - Requires location scanning
   - Updates tracking system

## Location Tracking

Each stage includes specific location tracking:
- Production Area
- Wash Bins
- Laundry Facility
- QC Station
- Pre-finishing Bins
- Finishing Area
- Pre-packing Area
- Shipping Pickup Area

## Status Updates

The system maintains:
- Current process step
- Location information
- Completion status
- Next required action
- Historical tracking

## Request Area Display

The request area dynamically updates to show:
1. Current step in overall process
2. Specific instructions for current task
3. Progress tracking
4. Required actions
5. Confirmation steps 