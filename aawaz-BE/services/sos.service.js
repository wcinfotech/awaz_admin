import UserSosContact from '../models/user-sos-contact.model.js';
import SosEvent from '../models/sos-event.model.js';
import ActivityLogger from '../utils/activity-logger.js';

class SosService {
    /**
     * Save SOS contacts for a user
     */
    async saveSosContacts(userId, contacts) {
        try {
            // Validate exactly 2 contacts
            if (!contacts || contacts.length !== 2) {
                throw new Error('Exactly 2 SOS contacts are required');
            }

            // Validate contact fields
            for (const contact of contacts) {
                if (!contact.name || !contact.phone || !contact.countryCode) {
                    throw new Error('All contact fields (name, phone, countryCode) are required');
                }
                // Basic phone validation
                if (!/^\d{10,15}$/.test(contact.phone.replace(/\D/g, ''))) {
                    throw new Error(`Invalid phone number: ${contact.phone}`);
                }
            }

            const sosContacts = await UserSosContact.findOneAndUpdate(
                { userId },
                { 
                    contacts,
                    updatedAt: new Date()
                },
                { 
                    upsert: true, 
                    new: true,
                    runValidators: true
                }
            ).populate('userId', 'name email username');

            // Log activity
            ActivityLogger.logSosAdmin('SOS_CONTACT_ADDED', 'User updated SOS emergency contacts', userId, {
                contactCount: contacts.length,
                contactNames: contacts.map(c => c.name)
            });

            return sosContacts;
        } catch (error) {
            ActivityLogger.logError('SOS_CONTACTS_SAVE_ERROR', 'Error saving SOS contacts', error, {
                userId
            });
            throw error;
        }
    }

    /**
     * Get SOS contacts for a user
     */
    async getSosContacts(userId) {
        try {
            const contacts = await UserSosContact.findOne({ userId })
                .select('contacts')
                .lean();
            
            return contacts || null;
        } catch (error) {
            ActivityLogger.logError('SOS_CONTACTS_GET_ERROR', 'Error fetching SOS contacts', error, {
                userId
            });
            throw error;
        }
    }

    /**
     * Trigger SOS emergency alert
     */
    async triggerSos(userId, locationData) {
        try {
            const { latitude, longitude, address } = locationData;

            // Validate coordinates
            if (!latitude || !longitude || 
                isNaN(latitude) || isNaN(longitude) ||
                latitude < -90 || latitude > 90 ||
                longitude < -180 || longitude > 180) {
                throw new Error('Invalid coordinates provided');
            }

            // Get user's SOS contacts
            const sosContacts = await UserSosContact.findOne({ userId });
            if (!sosContacts || sosContacts.contacts.length !== 2) {
                throw new Error('SOS contacts not configured. Please set up emergency contacts first.');
            }

            // Get user details
            const user = await UserSosContact.findOne({ userId }).populate('userId', 'name username email');
            if (!user || !user.userId) {
                throw new Error('User not found');
            }

            const userData = user.userId;
            const userName = userData.name || userData.username || 'Unknown User';

            // Generate Google Maps link
            const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;

            // Create SOS event
            const sosEvent = new SosEvent({
                userId,
                latitude,
                longitude,
                address: address || `${latitude}, ${longitude}`,
                mapLink,
                contacts: sosContacts.contacts.map(contact => ({
                    phone: `${contact.countryCode}${contact.phone}`,
                    name: contact.name,
                    status: 'SENT'
                }))
            });

            await sosEvent.save();

            // Log SOS trigger
            ActivityLogger.logSosAdmin('SOS_TRIGGERED', 'User triggered SOS emergency alert', userId, {
                latitude,
                longitude,
                address,
                mapLink,
                sosEventId: sosEvent._id
            });

            // Send messages asynchronously (non-blocking)
            this.sendSosMessages(sosEvent, userName, userData).catch(error => {
                ActivityLogger.logError('SOS_MESSAGE_SEND_ERROR', 'Error sending SOS messages', error, {
                    sosEventId: sosEvent._id,
                    userId
                });
            });

            return sosEvent;
        } catch (error) {
            ActivityLogger.logError('SOS_TRIGGER_ERROR', 'Error triggering SOS', error, {
                userId,
                locationData
            });
            throw error;
        }
    }

    /**
     * Send SOS messages to contacts (async)
     */
    async sendSosMessages(sosEvent, userName, userData) {
        // Enhanced message with detailed location information
        const locationInfo = sosEvent.address 
            ? `📍 Location: ${sosEvent.address}\n🗺️ Live Maps: ${sosEvent.mapLink}\n📊 Coordinates: ${sosEvent.latitude}, ${sosEvent.longitude}`
            : `📍 Location: ${sosEvent.latitude}, ${sosEvent.longitude}\n🗺️ Live Maps: ${sosEvent.mapLink}`;

        const message = `🚨 SOS ALERT 🚨\n${userName} needs immediate help!\n\n${locationInfo}\n\n⏰ Time: ${sosEvent.triggeredAt.toLocaleString()}\n\n📞 Please call emergency services immediately!`;

        for (let i = 0; i < sosEvent.contacts.length; i++) {
            const contact = sosEvent.contacts[i];
            try {
                // Send message (using mock SMS provider for now)
                const response = await this.sendMessage(contact.phone, message);
                
                // Update contact status
                contact.status = 'DELIVERED';
                contact.providerResponse = JSON.stringify(response);
                contact.deliveredAt = new Date();

                ActivityLogger.logSystem('SOS_MESSAGE_SENT', 'SOS message sent successfully', null, {
                    sosEventId: sosEvent._id,
                    phone: contact.phone,
                    response
                });
            } catch (error) {
                // Update contact status to failed
                contact.status = 'FAILED';
                contact.providerResponse = error.message;
                contact.failedAt = new Date();

                ActivityLogger.logSystem('SOS_MESSAGE_FAILED', 'SOS message delivery failed', error, {
                    sosEventId: sosEvent._id,
                    phone: contact.phone,
                    error: error.message
                });

                // Retry once
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                    const retryResponse = await this.sendMessage(contact.phone, message);
                    contact.status = 'DELIVERED';
                    contact.providerResponse = JSON.stringify(retryResponse);
                    contact.deliveredAt = new Date();
                    
                    ActivityLogger.logSystem('SOS_MESSAGE_RETRY_SUCCESS', 'SOS message retry successful', null, {
                        sosEventId: sosEvent._id,
                        phone: contact.phone
                    });
                } catch (retryError) {
                    ActivityLogger.logSystem('SOS_MESSAGE_RETRY_FAILED', 'SOS message retry failed', retryError, {
                        sosEventId: sosEvent._id,
                        phone: contact.phone
                    });
                }
            }
        }

        // Update overall status
        sosEvent.updateOverallStatus();
        await sosEvent.save();
    }

    /**
     * Send message via SMS provider (mock implementation)
     */
    async sendMessage(phone, message) {
        // Mock SMS provider response
        // In production, integrate with Twilio, MSG91, Fast2SMS, etc.
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate 90% success rate
                if (Math.random() > 0.1) {
                    resolve({
                        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        status: 'sent',
                        cost: 0.50,
                        provider: 'mock-sms-provider'
                    });
                } else {
                    reject(new Error('SMS provider temporarily unavailable'));
                }
            }, 1000); // 1 second delay to simulate network
        });
    }

    /**
     * Get list of SOS events for admin
     */
    async getSosList(filters = {}) {
        try {
            console.log("🔍 SOS Service Filters:", filters);
            
            const { status, date, userId, page = 1, limit = 20 } = filters;
            
            const query = {};
            
            if (status && status !== 'all') {
                query.overallStatus = status;
            }
            
            if (userId) {
                query.userId = userId;
            }
            
            if (date) {
                const startDate = new Date(date);
                const endDate = new Date(date);
                endDate.setDate(endDate.getDate() + 1);
                query.triggeredAt = { $gte: startDate, $lt: endDate };
            }

            console.log("🔍 SOS Service Query:", query);

            const skip = (page - 1) * limit;

            try {
                const sosEvents = await SosEvent.find(query)
                    .populate('userId', 'name username email profilePicture')
                    .populate('resolvedBy', 'name email')
                    .sort({ triggeredAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean();

                const total = await SosEvent.countDocuments(query);

                console.log("🔍 SOS Service Results:", { eventsCount: sosEvents.length, total });

                return {
                    events: sosEvents || [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: total || 0,
                        pages: Math.ceil((total || 0) / limit)
                    }
                };
            } catch (dbError) {
                console.error("🔍 SOS Service DB Error:", dbError);
                // Return empty result if DB operations fail
                return {
                    events: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        pages: 0
                    }
                };
            }
        } catch (error) {
            console.error("🔍 SOS List Service Error:", error);
            ActivityLogger.logError('SOS_LIST_ERROR', 'Error fetching SOS list', error, { filters });
            // Return empty result instead of throwing
            return {
                events: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    pages: 0
                }
            };
        }
    }

    /**
     * Get SOS event details
     */
    async getSosEventDetails(sosId) {
        try {
            const sosEvent = await SosEvent.findById(sosId)
                .populate('userId', 'name username email profilePicture')
                .populate('resolvedBy', 'name email')
                .lean();

            if (!sosEvent) {
                throw new Error('SOS event not found');
            }

            return sosEvent;
        } catch (error) {
            ActivityLogger.logError('SOS_DETAILS_ERROR', 'Error fetching SOS details', error, { sosId });
            throw error;
        }
    }

    /**
     * Mark SOS as resolved
     */
    async resolveSos(sosId, adminId) {
        try {
            const sosEvent = await SosEvent.findByIdAndUpdate(
                sosId,
                {
                    overallStatus: 'RESOLVED',
                    resolvedAt: new Date(),
                    resolvedBy: adminId
                },
                { new: true }
            ).populate('userId', 'name username email');

            if (!sosEvent) {
                throw new Error('SOS event not found');
            }

            // Log admin action
            ActivityLogger.logSosAdmin('SOS_RESOLVED', 'Admin resolved SOS emergency', adminId, {
                sosEventId: sosId,
                userId: sosEvent.userId._id,
                userName: sosEvent.userId.name,
                resolvedAt: sosEvent.resolvedAt
            });

            return sosEvent;
        } catch (error) {
            ActivityLogger.logError('SOS_RESOLVE_ERROR', 'Error resolving SOS', error, { sosId, adminId });
            throw error;
        }
    }
}

export default new SosService();
