import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import { paginationDetails, paginationFun } from "../helper/common.js";
import Notification from "../models/notification.model.js";

const getUserNotifications = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, search } = req.query;

  try {
    let query = { userId };
    const { skip, limit: parsedLimit } = paginationFun({ page, limit });

    // Base notification query
    let userNotifications = await Notification.findOne(query)
      .populate('notifications.eventId', 'title description attachments postType');

    if (!userNotifications) {
      return apiResponse({
        res,
        status: true,
        message: "No notifications found",
        data: {
          page: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          limit: parseInt(limit),
          notifications: []
        },
        statusCode: StatusCodes.OK
      });
    }

    // Get all notifications and sort by createdAt
    let notifications = userNotifications.notifications;
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    // Apply search filter if provided
    if (search) {
      notifications = notifications.filter(notification => 
        notification.title.toLowerCase().includes(search.toLowerCase()) ||
        notification.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get total count for pagination
    const totalItems = notifications.length;

    // Apply pagination
    notifications = notifications.slice(skip, skip + parsedLimit);

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id,
      title: notification.title,
      description: notification.description,
      distance: `${notification.distance} km`,
      attachment: notification.attachment,
      thumbnail: notification.attachment,
      notificationSendTime: notification.createdAt,
      eventId: notification.eventId._id,
    }));

    // Calculate pagination details
    const pagination = paginationDetails({
      page: parseInt(page),
      totalItems,
      limit: parsedLimit
    });

    return apiResponse({
      res,
      status: true,
      message: "Notifications fetched successfully",
      data: {
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        limit: pagination.limit,
        notifications: formattedNotifications
      },
      statusCode: StatusCodes.OK
    });

  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch notifications",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR
    });
  }
};

export default {
  getUserNotifications,
};
