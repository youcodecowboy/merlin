# End-to-End Process Flow: Order to QC

## Process Overview Flowchart

```mermaid
flowchart TD
    %% Order Receipt and SKU Search
    Start([Order Received]) --> A[Search for Exact SKU Match]
    A --> B{UNCOMMITTED Units<br/>Available?}
    
    %% No Exact Match Path
    B -->|No| C[Search Universal SKU]
    C --> D{UNCOMMITTED<br/>Universal Units<br/>Available?}
    
    %% No Universal Match - Production Path
    D -->|No| E[Add to Production Queue]
    E --> F[Create Production Request]
    F --> G[Production Request Accepted]
    G --> H[Generate Units in Batch]
    
    %% Unit Generation and Status
    H --> I[Set Initial Status:<br/>STATUS1: UNCOMMITTED<br/>STATUS2: PRODUCTION]
    I --> J[Check Waitlist]
    J --> K{Orders in<br/>Waitlist?}
    
    %% Waitlist Processing
    K -->|Yes| L[Update Units:<br/>STATUS1: COMMITTED]
    K -->|No| M[Keep Units:<br/>STATUS1: UNCOMMITTED]
    
    %% Production Completion
    L & M --> N[Complete Production]
    N --> O[Scan QR for Activation]
    
    %% Post-Activation COMMITTED Flow
    O --> P{STATUS1?}
    P -->|COMMITTED| Q[Assign to Waitlist Order<br/>STATUS1: ASSIGNED]
    Q --> R[Generate Wash Request<br/>STATUS2: WASH_QUEUE]
    R --> S[Move to Wash Area]
    S --> T[Process Wash]
    T --> U[Return from Laundry]
    U --> UA[QC Scan QR for Reactivation]
    UA --> V[QC Stage<br/>STATUS2: QC]
    
    %% Post-Activation UNCOMMITTED Flow
    P -->|UNCOMMITTED| W[Update to STOCK]
    W --> X[Generate Storage Request<br/>STATUS2: STORAGE_QUEUE]
    X --> Y[Move to Storage]
    
    %% Direct Assignment Path from SKU Search
    B -->|Yes| Z[Direct Assignment<br/>STATUS1: ASSIGNED]
    D -->|Yes| Z
    Z --> AA[Generate Wash Request<br/>STATUS2: WASH_QUEUE]
    AA --> S
    
    %% Styling
    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef status fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef scan fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    
    class A,F,G,H,N,S,T,U,Y process
    class B,D,K,P decision
    class I,L,M,Q,R,W,X,Z,AA,V status
    class O,UA scan
```

## Key Process Stages

### 1. Order Receipt & SKU Search
- Order received with target SKU
- System searches for exact SKU match
- Falls back to universal SKU if no exact match
- Direct assignment if UNCOMMITTED units available

### 2. Production Request Flow
- Created when no matching units found
- Specifies quantity and universal SKU
- Accepted by production team
- Generates batch of units

### 3. Unit Status Management
- Initial status setting
- Waitlist processing
- Status updates based on availability
- Tracking through production stages

### 4. Post-Production Activation
- QR code scanning
- Status bifurcation:
  * COMMITTED → ASSIGNED + Wash
  * UNCOMMITTED → STOCK + Storage

### 5. Wash Processing
- Wash request generation
- Movement to wash area
- External laundry processing
- Return for QC

### 6. Quality Control
- QC department scans QR for reactivation
- STATUS2 updates to QC
- Measurement verification
- Quality inspection
- Defect checking
- Next stage determination

## Status Transitions Summary

### STATUS1 Transitions
```
UNCOMMITTED ──┬──> COMMITTED ──> ASSIGNED
              └──> STOCK
```

### STATUS2 Transitions
```
PRODUCTION ──┬──> WASH_QUEUE ──> WASHING ──> LAUNDRY ──> QC
            └──> STORAGE_QUEUE ──> STORAGE
```

## Key Decision Points

1. **SKU Match Check**
   - Exact match available?
   - Universal match available?
   - Production needed?

2. **Waitlist Processing**
   - Orders in waitlist?
   - Priority order?
   - Quantity match?

3. **Post-Activation Flow**
   - COMMITTED or UNCOMMITTED?
   - Wash type needed?
   - Storage location?

4. **Quality Control**
   - QR code reactivation required
   - Measurements within spec?
   - Quality acceptable?
   - Next stage determination? 