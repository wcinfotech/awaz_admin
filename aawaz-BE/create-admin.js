import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import AdminUser from './admin-panel/models/admin-user.model.js';
import enums from './config/enum.js';

mongoose.connect(process.env.MONGODB_URL).then(async () => {
  console.log('Connected to MongoDB');
  
  // Check existing admin users
  const users = await AdminUser.find({});
  console.log('\n=== Existing Admin Users ===');
  users.forEach(user => {
    console.log(`- ${user.email} (Role: ${user.role})`);
  });
  
  // Create admin user if not exists
  const existingAdmin = await AdminUser.findOne({ email: 'admin@awaaz.com' });
  if (!existingAdmin) {
    console.log('\n=== Creating Admin User ===');
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash('admin123', 10);
    
    const adminUser = new AdminUser({
      email: 'admin@awaaz.com',
      password: hashedPassword,
      role: 'admin',
      name: 'Admin User',
      provider: 'email',
      isVerified: true,
      ownerApproveStatus: enums.ownerApproveStatusEnum.APPROVED
    });
    
    await adminUser.save();
    console.log('Admin user created: admin@awaaz.com / admin123');
  } else {
    console.log('\n=== Admin user already exists ===');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
