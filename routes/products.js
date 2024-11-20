const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const createError = require('http-errors');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

// Get all products
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get product by SKU
router.get('/sku/:sku', async (req, res, next) => {
  try {
    const { sku } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError(404, 'Product not found');
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;