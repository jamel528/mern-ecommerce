const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user by ID (Admin only)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
    const { name, email, role, staffId } = req.body;
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If updating to salesman, ensure staffId is provided
        if (role === 'salesman' && !staffId) {
            return res.status(400).json({ 
                message: 'Staff ID is required for salesman role' 
            });
        }

        // If updating staffId, ensure the staff exists
        if (staffId) {
            const staff = await User.findOne({
                where: { id: staffId, role: 'staff' }
            });
            if (!staff) {
                return res.status(400).json({ 
                    message: 'Invalid staff ID' 
                });
            }
        }

        await user.update({
            name: name || user.name,
            email: email || user.email,
            role: role || user.role,
            staffId: staffId || user.staffId
        });

        res.json({ 
            message: 'User updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                staffId: user.staffId
            }
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user (Admin only)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get salesmen by staff ID (Staff only)
exports.getSalesmenByStaffId = async (req, res) => {
    try {
        const salesmen = await User.findAll({
            where: { 
                staffId: req.user.id,
                role: 'salesman'
            },
            attributes: { exclude: ['password'] }
        });
        res.json(salesmen);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Assign salesman to staff (Admin only)
exports.assignSalesmanToStaff = async (req, res) => {
    const { salesmanId, staffId } = req.body;
    try {
        // Verify both users exist and have correct roles
        const salesman = await User.findOne({
            where: { id: salesmanId, role: 'salesman' }
        });
        const staff = await User.findOne({
            where: { id: staffId, role: 'staff' }
        });

        if (!salesman || !staff) {
            return res.status(404).json({ 
                message: 'Invalid salesman or staff ID' 
            });
        }

        await salesman.update({ staffId });
        res.json({ 
            message: 'Salesman assigned successfully',
            salesman: {
                id: salesman.id,
                name: salesman.name,
                email: salesman.email,
                staffId: salesman.staffId
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};
