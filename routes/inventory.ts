import express from 'express'
import { validateRequest } from '@/lib/validation/middleware'
import { createInventoryItemSchema } from '@/lib/validation/schemas'
import { addInventoryItems } from '@/lib/core-functions'
import { logger } from '@/utils/logger'

const router = express.Router()

// Get inventory items with filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      status1,
      status2,
      search
    } = req.query

    const result = await getInventoryItems({
      page: Number(page),
      pageSize: Number(pageSize),
      sortBy: String(sortBy),
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
      status1: status1 as string | undefined,
      status2: status2 as string | undefined,
      search: search as string | undefined
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// Create inventory items
router.post('/',
  validateRequest(createInventoryItemSchema),
  async (req, res, next) => {
    try {
      const { sku, status1, status2, product_id } = req.body
      const quantity = req.body.quantity || 1

      const items = await addInventoryItems({
        sku,
        quantity,
        status1,
        status2,
        product_id
      })

      logger.info('Inventory items created:', { 
        sku, 
        quantity: items.length,
        status1,
        status2
      })

      res.status(201).json(items)
    } catch (error) {
      next(error)
    }
  }
)