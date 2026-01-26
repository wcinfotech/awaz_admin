import User from "../../models/user.model.js";
import config from "../../config/config.js";
import Notification from "../../models/notification.model.js";
import axios from 'axios';
import { getDistanceFromLatLonInKm } from "../../helper/filter-response.js";
import AdminEventType from "../models/admin-event-type.model.js";
import ActivityLogger from "../../utils/activity-logger.js";

export const sendEventNotifications = async (eventData, type) => {
  try {
    if (!eventData.latitude || !eventData.longitude) {
      throw new Error('Event location is required');
    }

    const eventCategory = await AdminEventType.findById({_id: eventData.eventTypeId});

    const users = await User.find({
      isBlocked: false,
      isDeleted: false,
      pushToken: { $exists: true, $ne: null },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    });

    const results = [];

    for (const user of users) {
      try {
        if (user?.notificationPreferences && user?.notificationPreferences[eventCategory?.notificationCategotyName] && type === "eventPost") {
          const distance = getDistanceFromLatLonInKm(
            parseFloat(eventData.latitude),
            parseFloat(eventData.longitude),
            parseFloat(user.latitude),
            parseFloat(user.longitude)
          );

          if (distance <= (user.radius || 12)) {
            const notificationResult = await sendEventPostNotificationToUser(
              [user.pushToken],
              {
                _id: eventData._id,
                title: eventData.title || 'New Event Nearby!',
                description: eventData.description || `There's a new event ${distance.toFixed(1)}km away from you`,
                attachment: eventData.attachment
              }
            );

            // Check if user already has notifications document
            let userNotification = await Notification.findOne({ userId: user._id });

            if (!userNotification) {
              // First time notification - create new document
              userNotification = new Notification({
                userId: user._id, 
                notifications: [{
                  eventId: eventData._id,
                  title: eventData.title,
                  description: eventData.description,
                  distance: parseFloat(distance.toFixed(2)),
                  attachment: eventData.attachment
                }]
              });
              await userNotification.save();
            } else {
              // User already has notifications - add to existing array
              userNotification.notifications.push({
                eventId: eventData._id,
                title: eventData.title,
                description: eventData.description,
                distance: parseFloat(distance.toFixed(2)),
                attachment: eventData.attachment
              });
              await userNotification.save();
            }

            results.push({
              userId: user._id,
              status: 'success',
              distance: distance.toFixed(2),
              notificationId: notificationResult.data?.id
            });
          }
        }

        if (user?.notificationPreferences && user?.notificationPreferences[eventCategory?.notificationCategotyName] && user.eventPostNotificationOnIds.includes(eventData?._id) && type === "eventPostTimeline") {
          const distance = getDistanceFromLatLonInKm(
            parseFloat(eventData.latitude),
            parseFloat(eventData.longitude),
            parseFloat(user.latitude),
            parseFloat(user.longitude)
          );

          if (distance <= (user.radius || 12)) {
            const notificationResult = await sendEventPostNotificationToUser(
              [user.pushToken],
              {
                _id: eventData._id,
                title: eventData.title || 'New Event Nearby!',
                description: eventData.description || `There's a new event ${distance.toFixed(1)}km away from you`,
                attachment: eventData.attachment
              }
            );

            // Check if user already has notifications document
            let userNotification = await Notification.findOne({ userId: user._id });

            if (!userNotification) {
              // First time notification - create new document
              userNotification = new Notification({
                userId: user._id, 
                notifications: [{
                  eventId: eventData._id,
                  title: eventData.title,
                  description: eventData.description,
                  distance: parseFloat(distance.toFixed(2)),
                  attachment: eventData.attachment
                }]
              });
              await userNotification.save();
            } else {
              // User already has notifications - add to existing array
              userNotification.notifications.push({
                eventId: eventData._id,
                title: eventData.title,
                description: eventData.description,
                distance: parseFloat(distance.toFixed(2)),
                attachment: eventData.attachment
              });
              await userNotification.save();
            }

            results.push({
              userId: user._id,
              status: 'success',
              distance: distance.toFixed(2),
              notificationId: notificationResult.data?.id
            });
          }
        }
      } catch (error) {
        results.push({
          userId: user._id,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Log notification broadcast
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failed').length;
    
    ActivityLogger.logNotification('NOTIFICATION_BROADCAST', `Event notification sent to ${successCount} users`, null, {
      eventId: eventData._id,
      eventTitle: eventData.title,
      totalUsers: users.length,
      successCount,
      failureCount,
      type,
      recipients: results.map(r => ({ userId: r.userId, status: r.status }))
    });

    return results;

  } catch (error) {
    ActivityLogger.logError('NOTIFICATION_FAILED', 'Failed to send event notifications', error, {
      eventId: eventData._id,
      type
    });
    throw error;
  }
};

export const sendEventPostNotificationToUser = async (playerIds, eventPost) => {
  try {
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error('Invalid player IDs provided');
    }

    if (!config.oneSignal.appId || !config.oneSignal.apiKey) {
      throw new Error('OneSignal configuration missing');
    }

    const message = {
      app_id: config.oneSignal.appId,
      include_player_ids: playerIds,
      contents: {
        en: eventPost.description || 'New event near you!'
      },
      headings: {
        en: eventPost.title || 'Event Notification'
      },
      data: {
        eventId: eventPost._id?.toString(),
        type: 'event_notification'
      },
      ...(eventPost.attachment && {
        large_icon: eventPost.attachment,
        big_picture: eventPost.attachment,
        ios_attachments: {
          id1: eventPost.attachment
        }
      }),
      android_group: "event_alerts",
      android_group_message: { en: "You have $[notif_count] new events nearby" },
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      priority: 10,
      buttons: [
        {
          id: "view",
          text: "View Event"
        }
      ]
    };

    const response = await axios.post('https://onesignal.com/api/v1/notifications', message,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${config.oneSignal.apiKey}`
        }
      }
    );

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors));
    }

    return {  
      success: true,
      data: response.data
    };

  } catch (error) {
    throw error;
  }
};

export const sendPostApproveAndRejectNotification = async (userId, isApproved) => {
  try {
    const notificationMessage = isApproved
      ? {
          title: 'Your Post is Approved!',
          description: `Your post has been approved. Thank you for following our community guidelines!`
        }
      : {
          title: 'Your Post was Rejected',
          description: `Your post was rejected because it did not comply with our community guidelines. Please retry Or Please review our terms and rules for future submissions.`
        };

    const user = await User.findById(userId);

    // Add additional validation for user and pushToken
    if (!user) {
      console.log('User not found, skipping notification');
      return {
        success: false,
        message: 'User not found'
      };
    }

    if (!user.pushToken) {
      console.log('No push token found for user, skipping notification');
      return {
        success: false,
        message: 'No push token available'
      };
    }

    // Validate push token format/validity before sending
    if (typeof user.pushToken !== 'string' || user.pushToken.trim() === '') {
      console.log('Invalid push token format, skipping notification');
      return {
        success: false,
        message: 'Invalid push token'
      };
    }

    try {
      const notificationResult = await sendSingleNotificationToUser(
        [user.pushToken],
        notificationMessage,
        isApproved
      );

      return {
        success: true,
        notificationId: notificationResult.data?.id,
        message: isApproved ? 'Post approved and notification sent.' : 'Post rejected and notification sent.'
      };
    } catch (notificationError) {
      console.log('Failed to send notification:', notificationError);
      return {
        success: false,
        message: 'Post status updated but notification failed'
      };
    }
    
  } catch (error) {
    console.log('Error in sendPostApproveAndRejectNotification:', error);
    // Don't throw the error, instead return failure status
    return {
      success: false,
      message: 'Error processing notification'
    };
  }
};

export const sendSingleNotificationToUser = async (playerIds, message, isApproved) => {
  try {
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw new Error('Invalid player IDs provided');
    }

    if (!config.oneSignal.appId || !config.oneSignal.apiKey) {
      throw new Error('OneSignal configuration missing');
    }

    const messagePayload = {
      app_id: config.oneSignal.appId,
      include_player_ids: playerIds,
      contents: {
        en: message.description || 'Notification message'
      },
      headings: {
        en: message.title || 'Notification Title'
      },
      data: {
        type: isApproved ? 'post_approved' : 'post_rejected',
      },
      priority: 10,
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      // buttons: [
      //   {
      //     id: "view",
      //     text: "View Post"
      //   }
      // ]
    };

    const response = await axios.post('https://onesignal.com/api/v1/notifications', messagePayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${config.oneSignal.apiKey}`
        }
      }
    );

    if (response.data.errors) {
      throw new Error(JSON.stringify(response.data.errors));
    }

    return response;
    
  } catch (error) {
    throw error;
  }
};

