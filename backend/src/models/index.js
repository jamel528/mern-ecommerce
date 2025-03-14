const { sequelize } = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const City = require('./City');
const DeliveryService = require('./DeliveryService');
const { Order, OrderItem } = require('./Order');

// Define all associations here to avoid circular dependencies
const defineAssociations = () => {
    // User self-reference for staff assignment
    User.belongsTo(User, { as: 'assignedStaff', foreignKey: 'staffId' });
    User.hasMany(User, { as: 'salesmen', foreignKey: 'staffId' });

    // Order associations with User roles
    Order.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
    Order.belongsTo(User, { as: 'salesman', foreignKey: 'salesmanId' });
    Order.belongsTo(User, { as: 'staff', foreignKey: 'staffId' });

    // User associations with Orders
    User.hasMany(Order, { as: 'customerOrders', foreignKey: 'customerId' });
    User.hasMany(Order, { as: 'salesmanOrders', foreignKey: 'salesmanId' });
    User.hasMany(Order, { as: 'staffOrders', foreignKey: 'staffId' });

    // Order delivery associations
    Order.belongsTo(DeliveryService, { foreignKey: 'deliveryServiceId' });
    Order.belongsTo(City, { as: 'deliveryCity', foreignKey: 'deliveryCityId' });

    // Order-Product many-to-many relationship through OrderItem
    Order.belongsToMany(Product, { 
        through: OrderItem,
        foreignKey: 'orderId',
        otherKey: 'productId'
    });
    Product.belongsToMany(Order, { 
        through: OrderItem,
        foreignKey: 'productId',
        otherKey: 'orderId'
    });

    // OrderItem direct associations
    OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
    OrderItem.belongsTo(Product, { foreignKey: 'productId' });
    Order.hasMany(OrderItem, { foreignKey: 'orderId' });
    Product.hasMany(OrderItem, { foreignKey: 'productId' });

    // DeliveryService-City many-to-many relationship
    DeliveryService.belongsToMany(City, { through: 'DeliveryServiceCity' });
    City.belongsToMany(DeliveryService, { through: 'DeliveryServiceCity' });
};

// Call the function to define associations
defineAssociations();

module.exports = {
    sequelize,
    User,
    Product,
    City,
    DeliveryService,
    Order,
    OrderItem
};
