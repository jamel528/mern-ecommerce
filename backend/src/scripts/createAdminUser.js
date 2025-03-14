const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const User = require('../models/User');

async function createAdminUser() {
  try {
    await sequelize.sync();

    const adminData = {
      name: 'Admin User',
      email: 'admin@shopease.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    };

    const existingAdmin = await User.findOne({
      where: { email: adminData.email }
    });

    if (!existingAdmin) {
      const admin = await User.create(adminData);
      console.log('Admin user created successfully:', {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      });
    } else {
      console.log('Admin user already exists');
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
