const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const City = require('./City');

const DeliveryService = sequelize.define('DeliveryService', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    pricePerKm: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    estimatedDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

// Define the many-to-many relationship with cities
const DeliveryServiceCity = sequelize.define('DeliveryServiceCity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    }
});

DeliveryService.belongsToMany(City, { through: DeliveryServiceCity });
City.belongsToMany(DeliveryService, { through: DeliveryServiceCity });

module.exports = DeliveryService;
