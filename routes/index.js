const express = require('express');
const router = express.Router();

const ordersRoutes = require('./orders');
const inventoryRoutes = require('./inventory');
const customersRoutes = require('./customers');
const productsRoutes = require('./products');

// Mount route handlers
router.use('/orders', ordersRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/customers', customersRoutes);
router.use('/products', productsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;