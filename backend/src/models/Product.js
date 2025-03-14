const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subcategory: {
        type: DataTypes.STRING
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
        defaultValue: 'active'
    },
    sku: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    weight: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
            min: 0
        }
    },
    dimensions: {
        type: DataTypes.JSON,
        defaultValue: {
            length: 0,
            width: 0,
            height: 0,
            unit: 'cm'
        }
    },
    tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
    featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        validate: {
            min: 0
        }
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    timestamps: true,
    hooks: {
        beforeValidate: async (product) => {
            // Generate SKU if not provided
            if (!product.sku && product.category) {
                const timestamp = Date.now().toString(36);
                const random = Math.random().toString(36).substring(2, 5);
                product.sku = `${product.category.substring(0, 3).toUpperCase()}-${timestamp}-${random}`.toUpperCase();
            }
        }
    }
});

module.exports = Product;
