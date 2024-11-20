import express from 'express'
import { validateRequest } from '@/lib/validation/middleware'
import { createOrderSchema } from '@/lib/validation/schemas'
import { createOrder, getNextOrderNumber } from '@/lib/core-functions'
import { logger } from '@/utils/logger'

const router = express.Router()

// Get all orders
router.get('/', async (req, res, next) => {
  try {
    const orders = await getOrders()
    res.json(orders)
  } catch (error) {
    next(error)
  }
})

// Create new order
router.post('/', 
  validateRequest(createOrderSchema),
  async (req, res, next) => {
    try {
      const { customer_id, order_items } = req.body
      let { number } = req.body

      // Auto-generate order number if not provided
      if (!number) {
        number = await getNextOrderNumber()
      }

      const order = await createOrder({
        customer_id,
        number,
        order_status: 'PENDING',
        items: order_items
      })

      logger.info('Order created:', { orderId: order.id, number: order.number })
      res.status(201).json(order)
    } catch (error) {
      next(error)
    }
  }
)