const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const { User, Product, City, DeliveryService, Order, OrderItem } = require('../models');
const { sequelize } = require('../config/db');

const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${random}`;
};

const seedDatabase = async () => {
  try {
    // Clear database
    await sequelize.sync({ force: true });
    console.log('Database cleared');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    console.log('Admin user created');

    // Create staff users
    const staffUsers = await Promise.all(
      Array(20).fill().map(async () => {
        return User.create({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: await bcrypt.hash('staff123', 10),
          role: 'staff'
        });
      })
    );
    console.log('Staff users created');

    // Create salesmen and assign to staff
    const salesmen = await Promise.all(
      Array(50).fill().map(async () => {
        const staffUser = faker.helpers.arrayElement(staffUsers);
        return User.create({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: await bcrypt.hash('salesman123', 10),
          role: 'salesman',
          staffId: staffUser.id
        });
      })
    );
    console.log('Salesmen created and assigned to staff');

    // Create customers
    const customers = await Promise.all(
      Array(100).fill().map(async () => {
        return User.create({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: await bcrypt.hash('customer123', 10),
          role: 'guest'
        });
      })
    );
    console.log('Customers created');

    // Create cities
    const cities = await Promise.all(
      Array(100).fill().map(async () => {
        return City.create({
          name: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.country(),
          isActive: Math.random() < 0.9 // 90% active
        });
      })
    );
    console.log('Cities created');

    // Create delivery services and assign cities
    const deliveryServices = await Promise.all(
      Array(100).fill().map(async (_, index) => {
        const service = await DeliveryService.create({
          name: `${faker.company.name()} Delivery #${index + 1}`,
          basePrice: faker.number.float({ min: 5, max: 20, precision: 0.01 }),
          pricePerKm: faker.number.float({ min: 0.5, max: 2, precision: 0.01 }),
          estimatedDays: faker.number.int({ min: 1, max: 7 }),
          isActive: Math.random() < 0.9 // 90% active
        });

        // Assign 5-20 random cities to each service
        const cityCount = faker.number.int({ min: 5, max: 20 });
        const selectedCities = faker.helpers.arrayElements(cities.filter(c => c.isActive), cityCount);
        await service.setCities(selectedCities);

        return {
          ...service.toJSON(),
          cities: selectedCities
        };
      })
    );
    console.log('Delivery services created and cities assigned');

    // Create products
    const products = await Promise.all(
      Array(100).fill().map(async () => {
        const category = faker.helpers.arrayElement(['Electronics', 'Clothing', 'Books', 'Home', 'Sports']);
        return Product.create({
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
          category,
          subcategory: faker.commerce.department(),
          stock: faker.number.int({ min: 10, max: 100 }),
          images: Array(faker.number.int({ min: 1, max: 4 }))
            .fill()
            .map(() => faker.image.url()),
          status: 'active',
          weight: faker.number.float({ min: 0.1, max: 20, precision: 0.1 }),
          dimensions: {
            length: faker.number.float({ min: 5, max: 100 }),
            width: faker.number.float({ min: 5, max: 100 }),
            height: faker.number.float({ min: 5, max: 100 }),
            unit: 'cm'
          },
          tags: Array(faker.number.int({ min: 1, max: 5 }))
            .fill()
            .map(() => faker.commerce.productAdjective()),
          featured: Math.random() < 0.2, // 20% featured
          discountPrice: Math.random() < 0.3 ? // 30% have discount
            faker.number.float({ min: 5, max: 500, precision: 0.01 }) :
            null
        });
      })
    );
    console.log('Products created');

    // Create orders
    const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const activeProducts = products.filter(p => p.stock > 0);
    const activeDeliveryServices = deliveryServices.filter(ds => ds.isActive);
    const activeCities = cities.filter(c => c.isActive);

    console.log(`Active products: ${activeProducts.length}`);
    console.log(`Active delivery services: ${activeDeliveryServices.length}`);
    console.log(`Active cities: ${activeCities.length}`);

    for (let i = 0; i < 100; i++) {
      if (!activeProducts.length || !activeDeliveryServices.length || !activeCities.length) {
        console.log('Not enough active items to create orders');
        break;
      }

      const salesman = faker.helpers.arrayElement(salesmen);
      const customer = faker.helpers.arrayElement(customers);
      const deliveryService = faker.helpers.arrayElement(activeDeliveryServices);
      const city = faker.helpers.arrayElement(activeCities);

      // Create order items (1-5 items per order)
      const itemCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(activeProducts, itemCount);
      const items = selectedProducts.map(product => {
        const quantity = faker.number.int({ min: 1, max: Math.min(5, product.stock) });
        return {
          productId: product.id,
          quantity,
          price: product.price
        };
      });

      // Calculate total amount and delivery fee
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const salesmanCommission = totalAmount * 0.1; // 10% commission
      const deliveryDistance = faker.number.float({ min: 10, max: 100 });
      const deliveryFee = Number(deliveryService.basePrice) + (deliveryDistance * Number(deliveryService.pricePerKm));

      const transaction = await sequelize.transaction();
      try {
        // Create order
        const order = await Order.create(
          {
            orderNumber: await generateOrderNumber(),
            totalAmount,
            shippingAddress: {
              street: faker.location.streetAddress(),
              city: city.name,
              state: faker.location.state(),
              zipCode: faker.location.zipCode(),
              country: faker.location.country()
            },
            deliveryFee,
            salesmanCommission,
            customerId: customer.id,
            salesmanId: salesman.id,
            staffId: salesman.staffId,
            deliveryServiceId: deliveryService.id,
            deliveryCityId: city.id,
            status: faker.helpers.arrayElement(orderStatuses),
            OrderItems: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          },
          { 
            transaction,
            include: [{ model: OrderItem }]
          }
        );

        // Update product stock
        for (const item of items) {
          await Product.update(
            { stock: sequelize.literal(`stock - ${item.quantity}`) },
            { where: { id: item.productId }, transaction }
          );
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      if ((i + 1) % 10 === 0) {
        console.log(`Created ${i + 1} orders...`);
      }
    }
    console.log('Orders created');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function if this file is run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
