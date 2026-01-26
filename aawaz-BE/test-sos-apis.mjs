import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Test configuration
const testUser = {
    email: 'test@example.com',
    password: 'password123'
};

const testAdmin = {
    email: 'admin@example.com',
    password: 'admin123'
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    const data = await response.json();
    return { response, data };
}

// Test user authentication
async function testUserAuth() {
    console.log('🔐 Testing user authentication...');
    
    try {
        const { response, data } = await apiRequest('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(testUser)
        });
        
        if (response.ok && data.status) {
            console.log('✅ User login successful');
            return data.body.token;
        } else {
            console.log('❌ User login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ User login error:', error.message);
        return null;
    }
}

// Test admin authentication
async function testAdminAuth() {
    console.log('🔐 Testing admin authentication...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(testAdmin)
        });
        
        if (response.ok && data.status) {
            console.log('✅ Admin login successful');
            return data.body.token;
        } else {
            console.log('❌ Admin login failed:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Admin login error:', error.message);
        return null;
    }
}

// Test SOS contacts save
async function testSaveSosContacts(userToken) {
    console.log('📱 Testing SOS contacts save...');
    
    try {
        const { response, data } = await apiRequest('/api/v1/user/sos-contacts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                contacts: [
                    {
                        name: 'Father',
                        phone: '9876543210',
                        countryCode: '+91'
                    },
                    {
                        name: 'Mother',
                        phone: '9876543211',
                        countryCode: '+91'
                    }
                ]
            })
        });
        
        if (response.ok && data.status) {
            console.log('✅ SOS contacts saved successfully');
            return true;
        } else {
            console.log('❌ SOS contacts save failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ SOS contacts save error:', error.message);
        return false;
    }
}

// Test SOS contacts get
async function testGetSosContacts(userToken) {
    console.log('📱 Testing SOS contacts get...');
    
    try {
        const { response, data } = await apiRequest('/api/v1/user/sos-contacts', {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ SOS contacts retrieved successfully');
            console.log('📋 Contacts:', data.data.contacts);
            return true;
        } else {
            console.log('❌ SOS contacts get failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ SOS contacts get error:', error.message);
        return false;
    }
}

// Test SOS trigger
async function testTriggerSos(userToken) {
    console.log('🚨 Testing SOS trigger...');
    
    try {
        const { response, data } = await apiRequest('/api/v1/user/sos/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                latitude: 21.2247,
                longitude: 72.8069,
                address: 'Ring Road, Surat'
            })
        });
        
        if (response.ok && data.status) {
            console.log('✅ SOS triggered successfully');
            console.log('📍 Map Link:', data.data.mapLink);
            console.log('📊 Status:', data.data.overallStatus);
            return data.data.sosEventId;
        } else {
            console.log('❌ SOS trigger failed:', data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ SOS trigger error:', error.message);
        return null;
    }
}

// Test admin SOS list
async function testAdminSosList(adminToken) {
    console.log('📋 Testing admin SOS list...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/sos/list', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Admin SOS list retrieved successfully');
            console.log('📊 Total events:', data.data.pagination.total);
            console.log('📊 Events:', data.data.events.length);
            return true;
        } else {
            console.log('❌ Admin SOS list failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Admin SOS list error:', error.message);
        return false;
    }
}

// Test admin SOS statistics
async function testAdminSosStatistics(adminToken) {
    console.log('📊 Testing admin SOS statistics...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/sos/statistics', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Admin SOS statistics retrieved successfully');
            console.log('📊 Total:', data.data.total);
            console.log('📊 Status breakdown:', data.data.statusBreakdown);
            return true;
        } else {
            console.log('❌ Admin SOS statistics failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Admin SOS statistics error:', error.message);
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🧪 Starting SOS API Tests...\n');
    
    // Test user authentication
    const userToken = await testUserAuth();
    if (!userToken) {
        console.log('❌ Cannot proceed without user authentication');
        return;
    }
    
    // Test admin authentication
    const adminToken = await testAdminAuth();
    if (!adminToken) {
        console.log('❌ Cannot proceed without admin authentication');
        return;
    }
    
    console.log('\n📱 Testing User APIs...');
    
    // Test SOS contacts save
    await testSaveSosContacts(userToken);
    
    // Test SOS contacts get
    await testGetSosContacts(userToken);
    
    // Test SOS trigger
    const sosEventId = await testTriggerSos(userToken);
    
    console.log('\n🖥️ Testing Admin APIs...');
    
    // Test admin SOS list
    await testAdminSosList(adminToken);
    
    // Test admin SOS statistics
    await testAdminSosStatistics(adminToken);
    
    console.log('\n🎉 SOS API Tests Completed!');
}

// Run tests
runTests().catch(console.error);
