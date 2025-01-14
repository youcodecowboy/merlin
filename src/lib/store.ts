import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScanEvent {
  type: string;
  success: boolean;
  details: string;
  location?: string;
  timestamp?: string;
  metadata?: {
    unitStatus1?: string;
    unitStatus2?: string;
    previousLocation?: string;
    currentLocation?: string;
    scanContext?: string;
    itemId?: string;
    sku?: string;
    error?: string;
    reason?: string;
    scannerConfig?: any;
    decodedText?: string;
    previousStatus1?: string;
    previousStatus2?: string;
    newStatus1?: string;
    newStatus2?: string;
    [key: string]: any;
  };
}

export interface Unit {
  id: string;
  sku: string;
  status1: string;
  status2: string;
  location?: string;
  scanHistory?: ScanEvent[];
  lastScanAt?: string;
  lastScanType?: string;
  lastScanSuccess?: boolean;
}

export interface StoreState {
  units: Unit[];
  recentScans: (ScanEvent & { unitId: string })[];
  recordScan: (id: string, scanEvent: Omit<ScanEvent, 'timestamp'>) => boolean;
  addUnit: (unit: Unit) => void;
  addOrder: (order: any) => void;
  activateUnit: (id: string) => boolean;
}

export const useMockDataStore = create<StoreState>()(
  persist(
    (set, get) => ({
      units: [
        {
          id: 'UNIT001',
          sku: 'TSH-BLK-L',
          status1: 'UNCOMMITTED',
          status2: 'PRODUCTION',
          location: 'WAREHOUSE',
          scanHistory: []
        },
        {
          id: 'UNIT002',
          sku: 'JNS-BLU-32',
          status1: 'UNCOMMITTED',
          status2: 'PRODUCTION',
          location: 'WAREHOUSE',
          scanHistory: []
        }
      ],
      recentScans: [],
      recordScan: (id: string, scanEvent: Omit<ScanEvent, 'timestamp'>) => {
        const now = new Date().toISOString();
        console.log('[SCAN_EVENT] Recording scan for unit:', id, scanEvent);
        
        // Get current state
        const currentState = get();
        
        // Find the unit
        const unit = currentState.units.find(u => u.id === id);
        if (!unit) {
          console.error('[SCAN_EVENT] Unit not found for scan:', id);
          return false;
        }
        
        // Validate scan event data
        if (!scanEvent.type || !scanEvent.details) {
          console.error('[SCAN_EVENT] Invalid scan event data:', scanEvent);
          return false;
        }
        
        // Create the new scan event with enhanced details
        const newScan: ScanEvent = {
          ...scanEvent,
          timestamp: now,
          details: `${scanEvent.details} (${scanEvent.type})`,
          metadata: {
            ...scanEvent.metadata,
            unitStatus1: unit.status1,
            unitStatus2: unit.status2,
            previousLocation: unit.location,
          }
        };
        console.log('[SCAN_EVENT] New scan event:', newScan);
        
        // Update the unit with the new scan
        const updatedUnit: Unit = {
          ...unit,
          scanHistory: [...(unit.scanHistory || []), newScan],
          lastScanAt: now,
          lastScanType: scanEvent.type,
          lastScanSuccess: scanEvent.success
        };
        console.log('[SCAN_EVENT] Updated unit:', updatedUnit);
        
        // Update the store
        set((state) => ({
          ...state,
          units: state.units.map(u => 
            u.id === id ? updatedUnit : u
          ),
          // Also maintain a global scan history
          recentScans: [
            { unitId: id, ...newScan },
            ...(state.recentScans || []).slice(0, 99) // Keep last 100 scans
          ]
        }));

        return true;
      },
      addUnit: (unit: Unit) => {
        set((state) => ({
          ...state,
          units: [...state.units, unit]
        }));
      },
      addOrder: (order: any) => {
        // Implementation for adding orders
        console.log('Adding order:', order);
      },
      activateUnit: (id: string) => {
        const unit = get().units.find(u => u.id === id);
        if (!unit || unit.status1 !== 'UNCOMMITTED') return false;
        
        set((state) => ({
          ...state,
          units: state.units.map(u => 
            u.id === id 
              ? { 
                  ...u, 
                  status1: 'COMMITTED',
                  status2: 'STOCK',
                  activatedAt: new Date().toISOString()
                }
              : u
          )
        }));
        
        return true;
      }
    }),
    {
      name: 'oms-mock-store',
      version: 1,
    }
  )
); 