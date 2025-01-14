# QR Code Activation Process

## Overview

QR code activation is a critical step in the production process that marks the transition of a unit from an uncommitted state to being actively tracked in production. This document outlines the rules and workflow for QR code activation.

## Rules

1. **One-Time Activation**
   - Each QR code can only be activated once
   - Activation is permanent and cannot be reversed
   - Only units with status1 = 'UNCOMMITTED' can be activated

2. **Activation State Changes**
   - Before activation:
     - status1: 'UNCOMMITTED'
     - No activatedAt timestamp
   - After activation:
     - status1: 'COMMITTED'
     - activatedAt timestamp is set
     - Unit becomes eligible for production tracking

3. **Activation Requirements**
   - Valid QR code that matches a unit in the system
   - Unit must be in UNCOMMITTED state
   - Physical item must be present for scanning

## Workflow

1. **Pre-Activation**
   - Unit is created in system with UNCOMMITTED status
   - QR code is printed and attached to physical item
   - Item is stored in initial location

2. **Activation Process**
   - Scan QR code for the first time
   - System verifies unit is UNCOMMITTED
   - System updates status to COMMITTED
   - System records activation timestamp
   - Unit becomes available for production tracking

3. **Post-Activation**
   - Unit can now be assigned to orders
   - Unit can move through production stages
   - Unit's history begins tracking from activation point

## Technical Implementation

```typescript
// Activation function in store
activateUnit(id: string): boolean {
  // Check if unit exists and is UNCOMMITTED
  const unit = units.find(u => u.id === id);
  if (!unit || unit.status1 !== 'UNCOMMITTED') return false;
  
  // Update unit status and add timestamp
  unit.status1 = 'COMMITTED';
  unit.activatedAt = new Date().toISOString();
  
  return true;
}
```

## Error Cases

1. **Invalid QR Code**
   - System shows error message
   - No state changes occur
   - User must verify correct QR code

2. **Already Activated**
   - System shows "already activated" message
   - Displays current unit status
   - No state changes occur

3. **Missing Unit**
   - System shows "unit not found" error
   - Suggests checking QR code validity
   - No state changes occur

## Best Practices

1. Always verify physical item matches QR code before activation
2. Ensure QR code is properly attached and scannable
3. Verify activation success before proceeding with production
4. Keep record of activation timestamp for tracking purposes
5. Train staff on importance of one-time activation rule 