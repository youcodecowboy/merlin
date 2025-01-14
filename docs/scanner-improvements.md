# Scanner Mode Improvements

## Overview
The current scanner implementation is limited by being locked to a single "type", which prevents flexible workflows like using the first scan for activation. This document outlines the proposed improvements to make the scanner more versatile and user-friendly.

## Proposed Scanner Modes

### 1. Activation Mode
- **Purpose**: Activating new units in the system
- **Workflow**:
  - Single scan process
  - Scan activates the unit and registers it in the system
  - Updates unit status to "activated"

### 2. Movement Mode
- **Purpose**: Relocating items between bins
- **Workflow**:
  - Two-part scanning process:
    1. First scan: Select the item to be moved
    2. Second scan: Target bin location
  - Updates item location in the system
- **Integration**:
  - Can be triggered from storage queue requests
  - Workflow cards can directly open scanner in movement mode

### 3. Look-up Mode
- **Purpose**: Quick item information access
- **Workflow**:
  - Single scan process
  - Opens detailed item view
  - No modifications to item data
  - Provides navigation to expanded item view

### 4. Defect Report Mode
- **Purpose**: Reporting defective items
- **Workflow**:
  - Single scan process
  - Opens defect reporting interface
  - Allows defect documentation
  - Updates item status to "defective"

## Implementation Considerations

### UI Components
- Modal with clear mode selection buttons
- Visual indicators for current mode
- Clear progress indication for multi-step processes (like Movement Mode)

### Integration Points
- Storage queue workflow integration
- Bin management system integration
- Item status tracking system
- Defect reporting system

### User Experience
- Clear mode indicators
- Intuitive mode switching
- Proper error handling for incorrect scan sequences
- Clear feedback for successful operations

## Benefits
1. Improved workflow efficiency
2. Reduced user errors
3. More flexible scanning operations
4. Task-specific scanning interfaces
5. Better integration with existing workflows

## Next Steps
1. Implement scanner mode selection UI
2. Update backend to handle different scanning modes
3. Integrate with existing systems
4. Add proper error handling
5. Test with real-world scenarios 