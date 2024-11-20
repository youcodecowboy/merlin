const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const createError = require('http-errors');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

// Validation middleware
const validateInventoryItem = [
  body('sku').isString(),
  body('quantity').isInt({ min: 1 }),
  body('status1').isIn(['STOCK', 'PRODUCTION']),
  body('status2').isIn(['COMMITTED', 'UNCOMMITTED'])
];

// Get inventory items with filtering and pagination
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
    } = req.query;

    let query = supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(
        (page - 1) * pageSize,
        page * pageSize - 1
      );

    if (status1) {
      query = query.eq('status1', status1);
    }

    if (status2) {
      query = query.eq('status2', status2);
    }

    if (search) {
      query = query.or(`sku.ilike.%${search}%,product_id.eq.${search}`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      items: data,
      total: count || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil((count || 0) / pageSize)
    });
  } catch (error) {
    next(error);
  }
});

// Add inventory items
router.post('/', validateInventoryItem, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, { details: errors.array() });
    }

    const { product_id, sku, quantity, status1, status2 } = req.body;

    // Create multiple inventory items based on quantity
    const items = Array.from({ length: quantity }, () => ({
      product_id,
      sku,
      status1,
      status2
    }));

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(items)
      .select();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update inventory item
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw createError(404, 'Inventory item not found');

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete inventory item
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;