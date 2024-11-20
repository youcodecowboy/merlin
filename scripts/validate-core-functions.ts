import * as fs from 'fs'
import * as ts from 'typescript'
import * as path from 'path'

// Define the expected function signatures
const requiredFunctions = {
  // SKU Management
  parseSKU: 'function parseSKU(sku: string): { style: string; waist: number; shape: string; inseam: number; wash: string; } | null',
  buildSKU: 'function buildSKU(components: { style: string; waist: number; shape: string; inseam: number; wash: string; }): string',
  getHemAdjustment: 'function getHemAdjustment(hem: "RWH" | "STH" | "ORL" | "HRL"): number',

  // Orders
  getOrders: 'function getOrders(): Promise<Order[]>',
  getNextOrderNumber: 'function getNextOrderNumber(): Promise<number>',
  createOrder: 'function createOrder(data: { customer_id: string; number: number; order_status: string; items: OrderItem[]; }): Promise<Order>',

  // Customers
  getCustomers: 'function getCustomers(): Promise<Customer[]>',
  createCustomer: 'function createCustomer(data: { email: string; name?: string; phone?: string; }): Promise<Customer>',

  // Products
  getProducts: 'function getProducts(): Promise<Product[]>',

  // Production Management
  getPendingProduction: 'function getPendingProduction(): Promise<PendingProduction[]>',
  createPendingProduction: 'function createPendingProduction(data: { sku: string; quantity: number; priority: string; notes?: string; }): Promise<PendingProduction>',
  acceptProductionRequest: 'function acceptProductionRequest(id: string, data: { sku: string; quantity: number; }): Promise<void>',
  getActiveProduction: 'function getActiveProduction(): Promise<ProductionRequest[]>',
  moveToNextStage: 'function moveToNextStage(id: string): Promise<string>',

  // Batches
  getBatches: 'function getBatches(params: { page: number; pageSize: number; sortBy: string; sortOrder: "asc" | "desc"; }): Promise<{ items: Batch[]; total: number; }>',
  getBatchDetails: 'function getBatchDetails(id: string): Promise<{ batch: Batch & { qr_codes: string[]; }; items: InventoryItem[]; }>',
  updateBatchStatus: 'function updateBatchStatus(id: string, status: "COMPLETED"): Promise<void>',

  // Inventory
  getInventoryItems: 'function getInventoryItems(params: { page: number; pageSize: number; sortBy: string; sortOrder: "asc" | "desc"; status1?: string; status2?: string; search?: string; }): Promise<{ items: InventoryItem[]; total: number; }>',
  getInventoryItem: 'function getInventoryItem(id: string): Promise<InventoryItem>',
  addInventoryItems: 'function addInventoryItems(data: { product_id?: string; sku: string; quantity: number; status1: string; status2: string; }): Promise<InventoryItem[]>',
  updateInventoryItem: 'function updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<InventoryItem>',
  deleteInventoryItem: 'function deleteInventoryItem(id: string): Promise<void>',

  // Events
  getInventoryEvents: 'function getInventoryEvents(itemId: string): Promise<InventoryEvent[]>',
  logQRCodeDownload: 'function logQRCodeDownload(itemId: string, item: InventoryItem): Promise<void>'
}

function validateCoreFunctions() {
  const coreFunctionsPath = path.join(process.cwd(), 'src', 'lib', 'core-functions.ts')
  
  // Read and parse the file
  const sourceFile = ts.createSourceFile(
    coreFunctionsPath,
    fs.readFileSync(coreFunctionsPath, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )

  const foundFunctions = new Set<string>()
  let errors: string[] = []

  // Visit each node in the source file
  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      const functionName = node.name.text
      foundFunctions.add(functionName)

      // Get the function signature
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
      const signature = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile)

      // Check if the function is required and validate its signature
      if (requiredFunctions[functionName]) {
        const expectedSignature = requiredFunctions[functionName]
        if (!signature.includes(expectedSignature)) {
          errors.push(`Invalid signature for ${functionName}. Expected: ${expectedSignature}`)
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  // Check for missing functions
  for (const requiredFunction of Object.keys(requiredFunctions)) {
    if (!foundFunctions.has(requiredFunction)) {
      errors.push(`Missing required function: ${requiredFunction}`)
    }
  }

  // Report results
  if (errors.length > 0) {
    console.error('\n❌ Core Functions Validation Failed:\n')
    errors.forEach(error => console.error(`  - ${error}`))
    process.exit(1)
  } else {
    console.log('\n✅ Core Functions Validation Passed\n')
    console.log(`Found all ${Object.keys(requiredFunctions).length} required functions with correct signatures.`)
  }
}

validateCoreFunctions()