const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getSalesmenByStaffId,
    assignSalesmanToStaff
} = require('../controllers/userController');

// Admin routes
router.get('/', auth, checkRole(['admin']), getAllUsers);
router.get('/:id', auth, checkRole(['admin']), getUserById);
router.put('/:id', auth, checkRole(['admin']), updateUser);
router.delete('/:id', auth, checkRole(['admin']), deleteUser);
router.post('/assign-salesman', auth, checkRole(['admin']), assignSalesmanToStaff);

// Staff routes
router.get('/staff/salesmen', auth, checkRole(['staff']), getSalesmenByStaffId);

module.exports = router;
