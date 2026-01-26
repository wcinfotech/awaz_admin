import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import AdminEventType from "../models/admin-event-type.model.js";
import helper from "../../helper/common.js";
import config from "../../config/config.js";
import enums from "../../config/enum.js";

// ============ for category ===============
const createEventType = async (req, res) => {
  const { eventName, notificationCategotyName, postType } = req.body;

  const eventIcon = req.file;
  const adminId = req.user.id;

  if (!eventIcon) {
    return apiResponse({
      res,
      status: false,
      message: "eventIcon is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    // Upload main event icon
    const eventIconUrl = await helper.uploadMediaInS3Bucket(
      eventIcon,
      config.mediaFolderEnum.EVENT_TYPE
    );

    const newEventType = new AdminEventType({
      eventName,
      notificationCategotyName,
      eventIcon: eventIconUrl,
      adminId,
      postType,
    });

    await newEventType.save();

    return apiResponse({
      res,
      status: true,
      message: "Event type created successfully.",
      statusCode: StatusCodes.CREATED,
      data: newEventType,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: error.message || "Failed to create event type.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getEventTypes = async (req, res) => {
  const { id, search, postType } = req.query;
  try {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    let query = {};
    if (id) query._id = id;
    if (postType) query.postType = postType;
    if (search)  query.eventName = { $regex: search, $options: "i" };

    let eventTypes = await AdminEventType.find(query)

    if (id && eventTypes.length === 0) {
      return apiResponse({
        res,
        status: false,
        message: "Event type not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return apiResponse({
      res,
      status: true,
      message: "Event types fetched successfully.",
      statusCode: StatusCodes.OK,
      data: eventTypes,
    });
  } catch (error) {
    console.log("error", error)
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch event types.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateEventType = async (req, res) => {
  const { eventName, notificationCategotyName, postType } = req.body;
  const { eventTypeId } = req.params;
  const eventIcon = req.file;

  try {
    const eventType = await AdminEventType.findById(eventTypeId);
    if (!eventType) {
      return apiResponse({
        res,
        status: false,
        message: "Event type not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (eventIcon) {
      const eventIconUrl = await helper.uploadMediaInS3Bucket(
        eventIcon,
        config.mediaFolderEnum.EVENT_TYPE
      );
      eventType.eventIcon = eventIconUrl;
    }

    if (eventName) eventType.eventName = eventName;
    if (notificationCategotyName)
      eventType.notificationCategotyName = notificationCategotyName;
    if (postType) eventType.postType = postType;

    await eventType.save();

    return apiResponse({
      res,
      status: true,
      message: "Event type updated successfully.",
      statusCode: StatusCodes.OK,
      data: eventType,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update event type.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const deleteEventType = async (req, res) => {
  const { eventTypeId } = req.params;

  try {
    const eventType = await AdminEventType.findByIdAndDelete(eventTypeId);

    if (!eventType) {
      return apiResponse({
        res,
        status: false,
        message: "Event type not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (eventType?.eventIcon) {
      await helper.deleteMediaFromS3Bucket(eventType?.eventIcon);
    }

    return apiResponse({
      res,
      status: true,
      message: "Event type deleted successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to delete event type.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// ============ for sub-category ===============
const addSingleSubCategory = async (req, res) => {
  const { eventTypeId } = req.params;
  const { eventName, notificationCategotyName } = req.body;
  const eventIcon = req.file;

  if (!eventIcon) {
    return apiResponse({
      res,
      status: false,
      message: "eventIcon is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    let iconUrl = null;

    if (eventIcon) {
      iconUrl = await helper.uploadMediaInS3Bucket(
        eventIcon,
        config.mediaFolderEnum.EVENT_TYPE
      );
    }

    const eventType = await AdminEventType.findById(eventTypeId);
    if (!eventType) {
      return apiResponse({
        res,
        status: false,
        message: "Category not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    eventType.subCategories.push({
      eventName,
      notificationCategotyName,
      eventIcon: iconUrl,
    });

    await eventType.save();

    return apiResponse({
      res,
      status: true,
      message: "Sub-category added successfully.",
      statusCode: StatusCodes.OK,
      data: eventType,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to add sub-category.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getSubCategoriesByEventType = async (req, res) => {
  const { eventTypeId } = req.params;

  try {
    const eventType = await AdminEventType.findById(eventTypeId).select(
      "subCategories"
    );

    if (!eventType) {
      return apiResponse({
        res,
        status: false,
        message: "Event type not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return apiResponse({
      res,
      status: true,
      message: "Subcategories fetched successfully.",
      statusCode: StatusCodes.OK,
      data: eventType.subCategories,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch subcategories.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateSingleSubCategory = async (req, res) => {
  const { eventName, notificationCategotyName } = req.body;
  const { eventTypeId, index } = req.params;
  const iconFile = req.file;

  try {
    const eventType = await AdminEventType.findById(eventTypeId);
    if (!eventType) {
      return apiResponse({
        res,
        status: false,
        message: "Event type not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const existingSubCategory = eventType.subCategories[index];
    if (!existingSubCategory) {
      return apiResponse({
        res,
        status: false,
        message: "Sub-category not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Only update fields that are provided
    if (eventName !== undefined) {
      existingSubCategory.eventName = eventName;
    }
    if (notificationCategotyName !== undefined) {
      existingSubCategory.notificationCategotyName = notificationCategotyName;
    }

    if (iconFile) {
      const iconUrl = await helper.uploadMediaInS3Bucket(
        iconFile,
        config.mediaFolderEnum.EVENT_TYPE
      );
      existingSubCategory.eventIcon = iconUrl;
    }

    // Save the updated sub-category
    eventType.subCategories[index] = existingSubCategory;
    await eventType.save();

    return apiResponse({
      res,
      status: true,
      message: "Sub-category updated successfully.",
      statusCode: StatusCodes.OK,
      data: existingSubCategory,
    });
  } catch (error) {
    console.error("Error updating sub-category:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to update sub-category.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const deleteSingleSubCategory = async (req, res) => {
  const { eventTypeId, index } = req.params;

  try {
    const eventType = await AdminEventType.findById(eventTypeId);
    if (!eventType) {
      return apiResponse({
        res,
        status: false,
        message: "Event type not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const subCategory = eventType.subCategories[index];
    if (!subCategory) {
      return apiResponse({
        res,
        status: false,
        message: "Sub-category not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (subCategory.eventIcon) {
      await helper.deleteMediaFromS3Bucket(subCategory.eventIcon);
    }

    eventType.subCategories.splice(index, 1);
    await eventType.save();

    return apiResponse({
      res,
      status: true,
      message: "Sub-category deleted successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to delete sub-category.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  createEventType,
  getEventTypes,
  updateEventType,
  updateSingleSubCategory,
  deleteEventType,
  deleteSingleSubCategory,
  addSingleSubCategory,
  getSubCategoriesByEventType,
};
