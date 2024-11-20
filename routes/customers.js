const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const createError = require('http-errors');
const { supabase } = require('../utils/supabase');
const logger = require('../utils/logger');

// Validation middleware
const validateCustomer = [
  body('email').isEmail(),
  body('name').optional().isString(),
  body('phone').optional().isString()
];

// Get all customers
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create new customer
router.post('/', validateCustomer, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError(400, { details: errors.array() });
    }

    const { email, name, phone } = req.body;

    const { data, error } = await supabase
      .from('customers')
      .insert({ email, name, phone })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;