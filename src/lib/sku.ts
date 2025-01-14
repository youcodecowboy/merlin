// SKU Components and Types
export interface SKU {
  style: string;
  waist: number;
  shape: string;
  length: number;
  wash: WashCode;
}

// Wash Types
export type LightWash = 'STA' | 'IND';
export type DarkWash = 'ONX' | 'JAG';
export type UniversalWash = 'RAW' | 'BRW';
export type WashCode = LightWash | DarkWash | UniversalWash;

// Wash Groups
export const WASH_GROUPS = {
  LIGHT: {
    TARGET_WASHES: ['STA', 'IND'] as LightWash[],
    UNIVERSAL_WASH: 'RAW' as UniversalWash
  },
  DARK: {
    TARGET_WASHES: ['ONX', 'JAG'] as DarkWash[],
    UNIVERSAL_WASH: 'BRW' as UniversalWash
  }
} as const;

// Status Constants
export const STATUS = {
  STATUS1: {
    UNCOMMITTED: 'UNCOMMITTED',
    COMMITTED: 'COMMITTED',
    ASSIGNED: 'ASSIGNED'
  },
  STATUS2: {
    PRODUCTION: 'PRODUCTION',
    WASH_QUEUE: 'WASH_QUEUE',
    WASHING: 'WASHING',
    LAUNDRY: 'LAUNDRY',
    QC: 'QC',
    FINISHING: 'FINISHING',
    PACKING: 'PACKING',
    SHIPPING: 'SHIPPING',
    FULFILLED: 'FULFILLED'
  }
} as const;

// SKU Utility Functions
export function formatSKU(sku: SKU): string {
  return `${sku.style}-${sku.waist}-${sku.shape}-${sku.length}-${sku.wash}`;
}

export function getUniversalWash(targetWash: WashCode): UniversalWash {
  if (WASH_GROUPS.LIGHT.TARGET_WASHES.includes(targetWash as LightWash)) {
    return WASH_GROUPS.LIGHT.UNIVERSAL_WASH;
  }
  if (WASH_GROUPS.DARK.TARGET_WASHES.includes(targetWash as DarkWash)) {
    return WASH_GROUPS.DARK.UNIVERSAL_WASH;
  }
  throw new Error(`Invalid wash code: ${targetWash}`);
}

export function isUniversalWash(wash: WashCode): boolean {
  return wash === WASH_GROUPS.LIGHT.UNIVERSAL_WASH || wash === WASH_GROUPS.DARK.UNIVERSAL_WASH;
}

export function getUniversalSKU(sku: SKU): SKU {
  return {
    ...sku,
    length: 36, // Universal length
    wash: getUniversalWash(sku.wash)
  };
}

// SKU Matching Functions
export function isExactMatch(target: SKU, candidate: SKU): boolean {
  return (
    target.style === candidate.style &&
    target.waist === candidate.waist &&
    target.shape === candidate.shape &&
    target.length === candidate.length &&
    target.wash === candidate.wash
  );
}

export function isUniversalMatch(target: SKU, candidate: SKU): boolean {
  const universalSKU = getUniversalSKU(target);
  return (
    target.style === candidate.style &&
    target.waist === candidate.waist &&
    target.shape === candidate.shape &&
    candidate.length >= target.length &&
    isUniversalWash(candidate.wash) &&
    candidate.wash === universalSKU.wash
  );
} 