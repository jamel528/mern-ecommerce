const { Order, OrderItem, Product, User, DeliveryService, City } = require("../models");
const { sequelize } = require("../config/db");
const { Op } = require("sequelize");

const orderController = {
  createOrder: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const {
        items,
        shippingAddress,
        customerId,
        deliveryServiceId,
        deliveryCityId,
      } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validate delivery service and city
      const deliveryService = await DeliveryService.findByPk(deliveryServiceId);
      if (!deliveryService || !deliveryService.isActive) {
        throw new Error('Invalid or inactive delivery service');
      }

      const city = await City.findByPk(deliveryCityId);
      if (!city || !city.isActive) {
        throw new Error('Invalid or inactive delivery city');
      }

      // Calculate total amount and validate stock
      let totalAmount = 0;
      for (const item of items) {
        const product = await Product.findByPk(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (product.status !== 'active') {
          throw new Error(`Product ${product.name} is not active`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }
        totalAmount += product.price * item.quantity;
      }

      // Calculate delivery fee based on distance
      const deliveryDistance = 50; // TODO: Implement actual distance calculation
      const deliveryFee = Number(deliveryService.basePrice) + (deliveryDistance * Number(deliveryService.pricePerKm));

      // Create order
      const order = await Order.create(
        {
          totalAmount,
          shippingAddress,
          customerId,
          salesmanId: userRole === "salesman" ? userId : null,
          staffId: userRole === "staff" ? userId : null,
          deliveryServiceId,
          deliveryCityId,
          status: "pending",
          deliveryFee,
          salesmanCommission: userRole === "salesman" ? totalAmount * 0.1 : 0, // 10% commission
          OrderItems: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: (items.find(i => i.productId === item.productId))?.price || 0
          }))
        },
        { 
          transaction,
          include: [{ model: OrderItem }]
        }
      );

      // Update stock levels
      for (const item of items) {
        await Product.update(
          { stock: sequelize.literal(`stock - ${item.quantity}`) },
          { where: { id: item.productId }, transaction }
        );
      }

      // Fetch the complete order with associations
      const completeOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: OrderItem,
            include: [{ 
              model: Product,
              attributes: ['id', 'name', 'price', 'sku', 'stock']
            }]
          },
          {
            model: User,
            as: "customer",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "salesman",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "staff",
            attributes: ['id', 'name', 'email']
          },
          {
            model: DeliveryService,
            attributes: ['id', 'name', 'basePrice', 'pricePerKm']
          },
          {
            model: City,
            as: "deliveryCity",
            attributes: ['id', 'name', 'state', 'country']
          }
        ],
        transaction
      });

      await transaction.commit();
      res.status(201).json(completeOrder);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },

  updateOrderStatus: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Only admin and staff can update order status
      if (!['admin', 'staff'].includes(req.user.role)) {
        throw new Error('Unauthorized: Only admin and staff can update order status');
      }

      const order = await Order.findByPk(id, {
        include: [{ 
          model: OrderItem,
          include: [{ 
            model: Product,
            attributes: ['id', 'name', 'stock']
          }]
        }]
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Handle stock updates based on status changes
      if (status === "cancelled" && order.status !== "cancelled") {
        // Increase stock on cancellation
        for (const item of order.OrderItems) {
          await item.Product.increment('stock', {
            by: item.quantity,
            transaction
          });
        }
      } else if (order.status === "cancelled" && status !== "cancelled") {
        // Decrease stock if order is being un-cancelled
        for (const item of order.OrderItems) {
          if (item.Product.stock < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.Product.name}`);
          }
          await item.Product.decrement('stock', {
            by: item.quantity,
            transaction
          });
        }
      }

      await order.update({ status }, { transaction });

      // Fetch updated order with all associations
      const updatedOrder = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            include: [{ 
              model: Product,
              attributes: ['id', 'name', 'price', 'sku', 'stock']
            }]
          },
          {
            model: User,
            as: "customer",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "salesman",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "staff",
            attributes: ['id', 'name', 'email']
          },
          {
            model: DeliveryService,
            attributes: ['id', 'name', 'basePrice', 'pricePerKm']
          },
          {
            model: City,
            as: "deliveryCity",
            attributes: ['id', 'name', 'state', 'country']
          }
        ],
        transaction
      });

      await transaction.commit();
      res.json(updatedOrder);
    } catch (error) {
      await transaction.rollback();
      res.status(400).json({ error: error.message });
    }
  },

  getOrders: async (req, res) => {
    try {
      const { status, startDate, endDate, salesmanId, staffId, page = 1, limit = 10 } = req.query;
      const where = {};

      if (status) where.status = status;
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      // Role-based filtering
      if (req.user.role === 'salesman') {
        where.salesmanId = req.user.id;
      } else if (req.user.role === 'staff') {
        where.staffId = req.user.id;
      } else if (req.user.role === 'admin') {
        // Admin can see all orders, but can still filter by salesman or staff
        if (salesmanId) where.salesmanId = salesmanId;
        if (staffId) where.staffId = staffId;
      }

      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          {
            model: OrderItem,
            include: [{ model: Product, attributes: ['id', 'name', 'price', 'sku'] }]
          },
          {
            model: User,
            as: "customer",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "salesman",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "staff",
            attributes: ['id', 'name', 'email']
          },
          {
            model: DeliveryService,
            attributes: ['id', 'name']
          },
          {
            model: City,
            as: "deliveryCity",
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        orders,
        totalCount: count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        hasMore: offset + orders.length < count
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getOrderById: async (req, res) => {
    try {
      const { id } = req.params;
      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            include: [{ 
              model: Product,
              attributes: ['id', 'name', 'price', 'sku']
            }]
          },
          {
            model: User,
            as: "customer",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "salesman",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "staff",
            attributes: ['id', 'name', 'email']
          },
          {
            model: DeliveryService,
            attributes: ['id', 'name', 'basePrice', 'pricePerKm']
          },
          {
            model: City,
            as: "deliveryCity",
            attributes: ['id', 'name', 'state', 'country']
          }
        ]
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check permission
      if (req.user.role === "salesman" && order.salesmanId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (req.user.role === "staff" && order.staffId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getCommissionSummary: async (req, res) => {
    try {
      const { startDate, endDate, salesmanId } = req.query;
      const where = {};

      // Date range filter
      if (startDate && endDate) {
        where.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      // Role-based filtering
      if (req.user.role === 'staff') {
        where.staffId = req.user.id;
      } else if (salesmanId && req.user.role === 'admin') {
        where.salesmanId = salesmanId;
      }

      // Get orders with commission
      const orders = await Order.findAll({
        where: {
          ...where,
          salesmanCommission: {
            [Op.gt]: 0
          }
        },
        include: [
          {
            model: User,
            as: "salesman",
            attributes: ['id', 'name', 'email']
          },
          {
            model: User,
            as: "staff",
            attributes: ['id', 'name', 'email']
          }
        ],
        attributes: [
          'salesmanId',
          'staffId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalSales'],
          [sequelize.fn('SUM', sequelize.col('salesmanCommission')), 'totalCommission']
        ],
        group: ['salesmanId', 'staffId', 'salesman.id', 'staff.id'],
        order: [[sequelize.fn('SUM', sequelize.col('salesmanCommission')), 'DESC']]
      });

      // Calculate summary statistics
      const summary = {
        totalOrders: orders.reduce((sum, o) => sum + parseInt(o.dataValues.orderCount), 0),
        totalSales: orders.reduce((sum, o) => sum + parseFloat(o.dataValues.totalSales), 0),
        totalCommission: orders.reduce((sum, o) => sum + parseFloat(o.dataValues.totalCommission), 0),
        averageCommissionRate: 0,
        salesmen: orders.map(order => ({
          id: order.salesman?.id,
          name: order.salesman?.name,
          email: order.salesman?.email,
          staffName: order.staff?.name,
          orderCount: parseInt(order.dataValues.orderCount),
          totalSales: parseFloat(order.dataValues.totalSales),
          totalCommission: parseFloat(order.dataValues.totalCommission),
          commissionRate: (parseFloat(order.dataValues.totalCommission) / parseFloat(order.dataValues.totalSales)) * 100
        }))
      };

      // Calculate average commission rate
      if (summary.totalSales > 0) {
        summary.averageCommissionRate = (summary.totalCommission / summary.totalSales) * 100;
      }

      res.json({
        summary,
        dateRange: {
          start: startDate || 'All time',
          end: endDate || 'All time'
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = orderController;
