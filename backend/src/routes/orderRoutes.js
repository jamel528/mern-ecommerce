const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { auth, checkRole } = require("../middleware/auth");

// Create order (Staff and Salesmen)
router.post(
  "/",
  auth,
  checkRole(["staff", "salesman"]),
  orderController.createOrder
);

// Get all orders (with role-based filtering)
router.get(
  "/",
  auth,
  checkRole(["admin", "staff", "salesman"]),
  orderController.getOrders
);

// Get order by ID
router.get(
  "/:id",
  auth,
  checkRole(["admin", "staff", "salesman"]),
  orderController.getOrderById
);

// Update order status (Admin and Staff only)
router.put(
  "/:id/status",
  auth,
  checkRole(["admin", "staff"]),
  orderController.updateOrderStatus
);

// Get commission summary (Admin and Staff only)
router.get(
  "/commissions/summary",
  auth,
  checkRole(["admin", "staff"]),
  orderController.getCommissionSummary
);

module.exports = router;
