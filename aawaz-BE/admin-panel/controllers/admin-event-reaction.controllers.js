import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../../helper/apiResponse.js";
import AdminEventReaction from "../models/admin-event-reaction.model.js";
import helper from "../../helper/common.js";
import config from "../../config/config.js";

const createEventReaction = async (req, res) => {
  const { reactionName } = req.body;
  const reactionIcon = req.file;
  const adminId = req.user.id;

  if (!reactionIcon) {
    return apiResponse({
      res,
      status: false,
      message: "Reaction icon is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    const reactionIconUrl = await helper.uploadMediaInS3Bucket(reactionIcon, config.mediaFolderEnum.EVENT_REACTION);
    const newEventReaction = new AdminEventReaction({
      reactionName,
      reactionIcon: reactionIconUrl,
      adminId,
    });

    await newEventReaction.save();

    return apiResponse({
      res,
      status: true,
      message: "Event reaction created successfully.",
      statusCode: StatusCodes.CREATED,
      data: newEventReaction,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to create event reaction.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getEventReactions = async (req, res) => {
  const { id, search } = req.query;
  console.log('[admin-event-reaction] getEventReactions called');
  console.log('[admin-event-reaction] Query params:', { id, search });
  console.log('[admin-event-reaction] User:', req.user);
  try {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    let query = {};
    if (id) query._id = id;
    if (search)  query.eventName = { $regex: search, $options: "i" };

    console.log('[admin-event-reaction] DB query:', query);
    const eventReactions = await AdminEventReaction.find(query);
    console.log('[admin-event-reaction] Found reactions:', eventReactions.length, eventReactions);

    if (id && eventReactions.length === 0) {
      return apiResponse({
        res,
        status: false,
        message: "Event reaction not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    return apiResponse({
      res,
      status: true,
      message: "Event reactions fetched successfully.",
      statusCode: StatusCodes.OK,
      data: eventReactions,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch event reactions.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const updateEventReaction = async (req, res) => {
  const { eventReactionId } = req.params;
  const { reactionName } = req.body;
  const reactionIcon = req.file;
  try {
    const eventReaction = await AdminEventReaction.findById(eventReactionId);

    if (!eventReaction) {
      return apiResponse({
        res,
        status: false,
        message: "Event reaction not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if (reactionName !== undefined) eventReaction.reactionName = reactionName;
    if (reactionIcon !== undefined) {
      if(eventReaction?.reactionIcon){
        await helper.deleteMediaFromS3Bucket(eventReaction?.reactionIcon)
      }
      const reactionIconUrl = await helper.uploadMediaInS3Bucket(reactionIcon, config.mediaFolderEnum.EVENT_REACTION);
      eventReaction.reactionIcon = reactionIconUrl;
    }

    await eventReaction.save();

    return apiResponse({
      res,
      status: true,
      message: "Event reaction updated successfully.",
      statusCode: StatusCodes.OK,
      data: eventReaction,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to update event reaction.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const deleteEventReaction = async (req, res) => {
  const { eventReactionId } = req.params;

  try {
    const eventReaction = await AdminEventReaction.findByIdAndDelete(eventReactionId);

    if (!eventReaction) {
      return apiResponse({
        res,
        status: false,
        message: "Event reaction not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if(eventReaction?.reactionIcon){
      await helper.deleteMediaFromS3Bucket(eventReaction?.reactionIcon)
    }

    return apiResponse({
      res,
      status: true,
      message: "Event reaction deleted successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to delete event reaction.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

export default {
  createEventReaction,
  getEventReactions,
  updateEventReaction,
  deleteEventReaction,
};