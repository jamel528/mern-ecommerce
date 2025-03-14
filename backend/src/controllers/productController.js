const { Product } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../models/index').sequelize;

// Get all products with advanced filters
exports.getAllProducts = async (req, res) => {
    try {
        const {
            category,
            subcategory,
            minPrice,
            maxPrice,
            inStock,
            status,
            featured,
            search,
            tags,
            sortBy,
            order = 'DESC',
            page = 1,
            limit = 10
        } = req.query;

        const filters = {};
        const offset = (page - 1) * limit;

        // Apply filters if provided
        if (category) {
            filters.category = category;
        }
        if (subcategory) {
            filters.subcategory = subcategory;
        }
        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) filters.price[Op.lte] = parseFloat(maxPrice);
        }
        if (inStock === 'true') {
            filters.stock = { [Op.gt]: 0 };
        }
        if (status) {
            filters.status = status;
        }
        if (featured === 'true') {
            filters.featured = true;
        }
        if (tags) {
            filters.tags = { [Op.overlap]: Array.isArray(tags) ? tags : [tags] };
        }
        if (search) {
            filters[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { sku: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Determine sort order
        let orderCriteria = [['createdAt', order]];
        if (sortBy) {
            switch (sortBy) {
                case 'price':
                    orderCriteria = [['price', order]];
                    break;
                case 'name':
                    orderCriteria = [['name', order]];
                    break;
                case 'stock':
                    orderCriteria = [['stock', order]];
                    break;
            }
        }

        const { count, rows: products } = await Product.findAndCountAll({
            where: filters,
            order: orderCriteria,
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            products,
            pagination: {
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error('Error fetching product:', err);
        res.status(500).json({ message: 'Error fetching product' });
    }
};

// Create new product
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            subcategory,
            stock,
            images,
            status,
            weight,
            dimensions,
            tags,
            featured,
            discountPrice,
            metadata
        } = req.body;

        // Validate required fields
        if (!name || !price || !category) {
            return res.status(400).json({
                message: 'Name, price, and category are required'
            });
        }

        // Validate price and stock
        if (price < 0) {
            return res.status(400).json({ message: 'Price must be non-negative' });
        }
        if (stock && stock < 0) {
            return res.status(400).json({ message: 'Stock must be non-negative' });
        }
        if (discountPrice && discountPrice >= price) {
            return res.status(400).json({ message: 'Discount price must be less than regular price' });
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            subcategory,
            stock: stock || 0,
            images: images || [],
            status: status || 'active',
            weight,
            dimensions,
            tags: tags || [],
            featured: featured || false,
            discountPrice,
            metadata: metadata || {}
        });

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (err) {
        console.error('Error creating product:', err);
        res.status(500).json({ message: 'Error creating product' });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            subcategory,
            images,
            status,
            weight,
            dimensions,
            tags,
            featured,
            discountPrice,
            metadata
        } = req.body;

        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate price if provided
        if (price !== undefined) {
            if (price < 0) {
                return res.status(400).json({ message: 'Price must be non-negative' });
            }
            if (discountPrice && discountPrice >= price) {
                return res.status(400).json({ message: 'Discount price must be less than regular price' });
            }
        }

        await product.update({
            name: name || product.name,
            description: description || product.description,
            price: price || product.price,
            category: category || product.category,
            subcategory: subcategory || product.subcategory,
            images: images || product.images,
            status: status || product.status,
            weight: weight || product.weight,
            dimensions: dimensions || product.dimensions,
            tags: tags || product.tags,
            featured: featured !== undefined ? featured : product.featured,
            discountPrice: discountPrice || product.discountPrice,
            metadata: metadata || product.metadata
        });

        res.json({
            message: 'Product updated successfully',
            product
        });
    } catch (err) {
        console.error('Error updating product:', err);
        res.status(500).json({ message: 'Error updating product' });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        await product.destroy();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Error deleting product' });
    }
};

// Update stock levels
exports.updateStock = async (req, res) => {
    try {
        const { quantity } = req.body;
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate new stock level
        const newStock = product.stock + parseInt(quantity);
        if (newStock < 0) {
            return res.status(400).json({ 
                message: 'Insufficient stock',
                currentStock: product.stock
            });
        }

        await product.update({ 
            stock: newStock,
            status: newStock === 0 ? 'inactive' : 'active'
        });

        res.json({
            message: 'Stock updated successfully',
            product: {
                id: product.id,
                name: product.name,
                stock: product.stock,
                status: product.status
            }
        });
    } catch (err) {
        console.error('Error updating stock:', err);
        res.status(500).json({ message: 'Error updating stock' });
    }
};

// Get product categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.findAll({
            attributes: [
                'category',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['category'],
            order: [[sequelize.col('count'), 'DESC']]
        });

        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

// Get product tags
exports.getTags = async (req, res) => {
    try {
        const products = await Product.findAll({
            attributes: ['tags'],
            where: {
                tags: { [Op.ne]: [] }
            }
        });

        const tags = [...new Set(products.flatMap(p => p.tags))];
        res.json(tags);
    } catch (err) {
        console.error('Error fetching tags:', err);
        res.status(500).json({ message: 'Error fetching tags' });
    }
};
