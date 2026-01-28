import mongoose from 'mongoose';
import AdminUserModel from './admin-panel/models/admin-user.model.js';
import bcrypt from 'bcrypt';
import config from './config/config.js';
import enums from './config/enum.js';

// Test admin user data
const testAdmin = {
    email: 'testadmin@example.com',
    password: 'testadmin123',
    name: 'Test Admin User',
    role: enums.userRoleEnum.ADMIN,
    isVerified: true,
    ownerApproveStatus: enums.ownerApproveStatusEnum.APPROVED
};

async function createTestAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoURI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await AdminUserModel.findOne({ email: testAdmin.email });
        if (existingAdmin) {
            console.log('ℹ️ Admin user already exists, updating...');
            
            // Update existing admin to be approved and verified
            existingAdmin.isVerified = true;
            existingAdmin.ownerApproveStatus = enums.ownerApproveStatusEnum.APPROVED;
            existingAdmin.password = await bcrypt.hash(testAdmin.password, 10);
            existingAdmin.name = testAdmin.name;
            
            await existingAdmin.save();
            console.log('✅ Admin user updated successfully');
        } else {
            // Create new admin user
            const hashedPassword = await bcrypt.hash(testAdmin.password, 10);
            
            const newAdmin = new AdminUserModel({
                ...testAdmin,
                password: hashedPassword
            });
            
            await newAdmin.save();
            console.log('✅ Admin user created successfully');
        }

        // Verify the admin was created
        const admin = await AdminUserModel.findOne({ email: testAdmin.email });
        console.log('📋 Admin details:');
        console.log(`   Email: ${admin.email}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Is Verified: ${admin.isVerified}`);
        console.log(`   Approval Status: ${admin.ownerApproveStatus}`);

        console.log('\n🚀 You can now login with:');
        console.log(`   Email: ${testAdmin.email}`);
        console.log(`   Password: ${testAdmin.password}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createTestAdmin();
