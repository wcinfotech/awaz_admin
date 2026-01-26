  import AdminEventPost from "../models/admin-event-post.model.js";
import { sendEventNotifications } from "../services/notification.services.js";

const handleEventGeoNotification = async (req, res) => {
  try {
    const {
      _id,
      latitude,
      longitude,
      title,
      description,
      eventTypeId,
      notificationType,
    } = req.body;

    const eventData = {
      _id,
      latitude,
      longitude,
      title,
      description,
      eventTypeId,
      notificationType,
    };

    const findPost = await AdminEventPost.findById(_id);
    if (findPost) {
      // Send notifications based on geo-location
      const notificationResults = await sendEventNotifications(
        eventData,
        notificationType
      );

      // Filter successful notifications
      const sendSuccessNotificationList = notificationResults?.filter(
        (notification) => notification.status === "success"
      );

      const notifiedCount = sendSuccessNotificationList?.length || 0;

      // Update event post with notified user count
      await AdminEventPost.findByIdAndUpdate(_id, {
        notifiedUserCount: notifiedCount,
      });

      console.log(`Geo notifications sent to this post -> ${_id}-${title}`);

      return res.status(200).json({
        status: true,
        message: "Geo notifications sent.",
        notifiedUserCount: notifiedCount,
      });
    }
  } catch (err) {
    console.error("Error in handleEventGeoNotification:", err);
    return res.status(500).json({
      status: false,
      message: "Server error: " + err.message,
    });
  }
};

export default {
  handleEventGeoNotification,
};
