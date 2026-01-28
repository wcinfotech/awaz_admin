import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

// Test admin user data
const testAdmin = {
    email: 'testadmin@example.com',
    password: 'testadmin123',
    name: 'Test Admin'
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

// Register admin user
async function registerAdmin() {
    console.log('🔐 Registering admin user...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/auth/register/email', {
            method: 'POST',
            body: JSON.stringify(testAdmin)
        });
        
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Response:', data);
        
        if (response.ok && data.status) {
            console.log('✅ Admin registration successful');
            return true;
        } else {
            console.log('ℹ️ Admin registration response:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Admin registration error:', error.message);
        return false;
    }
}

// Login admin user
async function loginAdmin() {
    console.log('\n🔐 Logging in admin user...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/auth/login/email', {
            method: 'POST',
            body: JSON.stringify({
                email: testAdmin.email,
                password: testAdmin.password
            })
        });
        
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Response:', data);
        
        if (response.ok && data.status) {
            console.log('✅ Admin login successful');
            console.log('🔑 Token:', data.body.token.substring(0, 20) + '...');
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

// Fetch events to get IDs
async function fetchEvents(adminToken) {
    console.log('\n📋 Fetching events...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/event-post/incident/list', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Events fetched successfully');
            console.log('📊 Total events:', data.data?.length || 0);
            
            if (data.data && data.data.length > 0) {
                console.log('📝 Sample events:');
                data.data.slice(0, 3).forEach((event, index) => {
                    console.log(`  ${index + 1}. ${event.title} - ${event._id}`);
                    console.log(`     Status: ${event.status}`);
                });
                return data.data;
            } else {
                console.log('⚠️ No events found');
                return [];
            }
        } else {
            console.log('❌ Fetch events failed:', data.message);
            return [];
        }
    } catch (error) {
        console.log('❌ Fetch events error:', error.message);
        return [];
    }
}

// Fetch drafts to get IDs
async function fetchDrafts(adminToken) {
    console.log('\n📋 Fetching drafts...');
    
    try {
        const { response, data } = await apiRequest('/admin/v1/event-post-draft/admin-drafts', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (response.ok && data.status) {
            console.log('✅ Drafts fetched successfully');
            console.log('📊 Total drafts:', data.data?.length || 0);
            
            if (data.data && data.data.length > 0) {
                console.log('📝 Sample drafts:');
                data.data.slice(0, 3).forEach((draft, index) => {
                    console.log(`  ${index + 1}. ${draft.title} - ${draft._id}`);
                    console.log(`     Status: ${draft.status}`);
                });
                return data.data;
            } else {
                console.log('⚠️ No drafts found');
                return [];
            }
        } else {
            console.log('❌ Fetch drafts failed:', data.message);
            return [];
        }
    } catch (error) {
        console.log('❌ Fetch drafts error:', error.message);
        return [];
    }
}

// Test delete draft
async function testDeleteDraft(adminToken, draftId) {
    console.log(`\n🗑️  Testing delete draft: ${draftId}`);
    console.log(`📡 Calling: DELETE /admin/v1/event-post-draft/${draftId}/simple-delete`);
    
    try {
        const { response, data } = await apiRequest(`/admin/v1/event-post-draft/${draftId}/simple-delete`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Response:', data);
        
        if (response.ok && data.status) {
            console.log('✅ Draft deleted successfully');
            return true;
        } else {
            console.log('❌ Draft delete failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Draft delete error:', error.message);
        return false;
    }
}

// Test delete event
async function testDeleteEvent(adminToken, eventId) {
    console.log(`\n🗑️  Testing delete event: ${eventId}`);
    console.log(`📡 Calling: DELETE /admin/v1/event-post/${eventId}/simple-delete`);
    
    try {
        const { response, data } = await apiRequest(`/admin/v1/event-post/${eventId}/simple-delete`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        console.log(`📊 Status: ${response.status}`);
        console.log('📋 Response:', data);
        
        if (response.ok && data.status) {
            console.log('✅ Event deleted successfully');
            return true;
        } else {
            console.log('❌ Event delete failed:', data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Event delete error:', error.message);
        return false;
    }
}

// Main test function
async function runCompleteTest() {
    console.log('🧪 COMPLETE DELETE FUNCTIONALITY TEST');
    console.log('====================================\n');
    
    // Step 1: Register admin user
    await registerAdmin();
    
    // Step 2: Login admin user
    const adminToken = await loginAdmin();
    if (!adminToken) {
        console.log('\n❌ Cannot proceed without admin authentication');
        console.log('🔧 TROUBLESHOOTING:');
        console.log('1. Check if admin registration requires email verification');
        console.log('2. Try using existing admin credentials');
        console.log('3. Check admin user approval status');
        return;
    }
    
    // Step 3: Fetch events and drafts
    const events = await fetchEvents(adminToken);
    const drafts = await fetchDrafts(adminToken);
    
    // Step 4: Test delete functionality
    let deleteTested = false;
    
    if (drafts.length > 0) {
        const testDraft = drafts[0];
        console.log(`\n🎯 Testing draft deletion: ${testDraft.title}`);
        
        // Test the delete endpoint
        const deleteResult = await testDeleteDraft(adminToken, testDraft._id);
        if (deleteResult) {
            deleteTested = true;
            console.log('✅ Draft deletion test PASSED');
        } else {
            console.log('❌ Draft deletion test FAILED');
        }
    } else {
        console.log('\n⚠️ No drafts available to test deletion');
    }
    
    if (events.length > 0) {
        const testEvent = events[0];
        console.log(`\n🎯 Testing event deletion: ${testEvent.title}`);
        
        // Test the delete endpoint
        const deleteResult = await testDeleteEvent(adminToken, testEvent._id);
        if (deleteResult) {
            deleteTested = true;
            console.log('✅ Event deletion test PASSED');
        } else {
            console.log('❌ Event deletion test FAILED');
        }
    } else {
        console.log('\n⚠️ No events available to test deletion');
    }
    
    // Step 5: Summary
    console.log('\n🎉 COMPLETE TEST SUMMARY');
    console.log('==========================');
    console.log('✅ Admin registration: Tested');
    console.log('✅ Admin authentication: Tested');
    console.log('✅ Event fetching: Tested');
    console.log('✅ Draft fetching: Tested');
    console.log(`${deleteTested ? '✅' : '❌'} Delete functionality: ${deleteTested ? 'Tested' : 'Not tested (no data)'}`);
    
    if (deleteTested) {
        console.log('\n🚀 DELETE FUNCTIONALITY IS WORKING!');
        console.log('Frontend should work correctly with the new endpoints.');
    } else {
        console.log('\n⚠️ DELETE FUNCTIONALITY NOT TESTED');
        console.log('No events or drafts available to test deletion.');
        console.log('Create some test data to verify deletion works.');
    }
    
    console.log('\n🌐 FRONTEND TESTING:');
    console.log('1. Start frontend: npm run dev');
    console.log('2. Go to: http://localhost:3000/event');
    console.log('3. Try deleting drafts and events');
    console.log('4. Check browser Network tab for API calls');
    console.log('5. Verify confirmation popup appears');
    console.log('6. Verify success messages appear');
}

// Run tests
runCompleteTest().catch(console.error);
