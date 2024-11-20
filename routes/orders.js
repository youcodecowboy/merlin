const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const createError = require('http-errors');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

// Validation middleware
const validateOrder = [
  body('customer_id').isUUID(),
  body('order_status').isString(),
  body('items').isArray(),
  body('items.*.sku').isString(),
  body('items.*.quantity').isInt({ min: 1 })
];

// Get all orders
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get next order number
router.get('/next-number', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('number')
      .order('number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw error;
    }

    const nextNumber = data?.number ? data.number + 1 : 1000;
    res.json({ number: nextNumber });
  } catch (error) {
    next(error);
  }
});

// Create new order
router.post('/', validateOrder, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, { details: errors.array() });
    }

    const { customer_id, order_status, items } = req.body;

    // Start a Supabase transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id,
        order_status
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Fetch the complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) throw fetchError;

    res.status(201).json(completeOrder);
  } catch (error) {
    next(error);
  }
});

module.exports = router;