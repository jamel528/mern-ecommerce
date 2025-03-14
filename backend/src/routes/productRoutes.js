const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
} = require('../controllers/productController');

// Product routes with role-based access
router.get('/', auth, getAllProducts);
router.get('/:id', auth, getProductById);

// Admin and Staff only routes
router.post('/', auth, checkRole(['admin', 'staff']), createProduct);
router.put('/:id', auth, checkRole(['admin', 'staff']), updateProduct);
router.delete('/:id', auth, checkRole(['admin']), deleteProduct);

// Stock management routes
router.put('/:id/stock', auth, checkRole(['admin', 'staff']), updateStock);

module.exports = router;
