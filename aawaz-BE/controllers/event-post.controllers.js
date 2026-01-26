import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/apiResponse.js";
import User from "../models/user.model.js";
import AdminEventPost from "../admin-panel/models/admin-event-post.model.js";
import EventPost from "../models/event-post.model.js";
import enums from "../config/enum.js";
import config from "../config/config.js";
import helper, { paginationDetails, paginationFun } from "../helper/common.js";
import { filterAndUpdateEventsByTime } from "../helper/filter-response.js";
import AdminEventType from "../admin-panel/models/admin-event-type.model.js";
import DraftEventPost from "../models/event-post-draft.model.js";
import ActivityLogger from "../utils/activity-logger.js";

const createUserEventPost = async (req, res) => {
  const {
    longitude,
    latitude,
    additionalDetails,
    hashTags,
    shareAnonymous,
    postType,
    eventTime,
    lostItemName,
    additionMobileNumber,
    countryCode,
    title,
    address,
    postCategoryId,
    attachmentUrl,
    thumbnailUrl,
    userPostDraftId
  } = req.body;
  const userId = req.user.id;
  const { attachment, thumbnail } = req.files;

  const user = await User.findById({ _id: userId });

  if (!user) {
    return apiResponse({
      res,
      status: false,
      message: "User not found.",
      statusCode: StatusCodes.NOT_FOUND,
    });
  }

  if (!attachment && !attachmentUrl) {
    return apiResponse({
      res,
      status: false,
      message: "attachment is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  if (!thumbnail && !thumbnailUrl) {
    return apiResponse({
      res,
      status: false,
      message: "thumbnail is required",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  try {
    let attachmentGeneratedUrl = attachmentUrl
    let thumbnailGeneratedUrl = thumbnailUrl;

    if(attachment) {
      attachmentGeneratedUrl = await helper.uploadMediaInS3Bucket(attachment[0], config.mediaFolderEnum.EVENT_POST);
    }
    if (thumbnail) {
      thumbnailGeneratedUrl = await helper.uploadMediaInS3Bucket(thumbnail[0], config.mediaFolderEnum.EVENT_POST);
    }

    const newEventPost = new EventPost({
      userId,
      longitude,
      latitude,
      eventTime,
      additionalDetails,
      lostItemName: lostItemName ? lostItemName : null,
      additionMobileNumber: additionMobileNumber ? additionMobileNumber : null,
      countryCode: countryCode ? countryCode : null,
      hashTags: hashTags ? hashTags : [],
      attachment: attachmentGeneratedUrl,
      thumbnail: thumbnailGeneratedUrl,
      shareAnonymous,
      postType,
      title: title ? title : null,
      address: address ? address : null,
      postCategoryId: postCategoryId ? postCategoryId : null,
    });

    await newEventPost.save();

    // Log post creation
    ActivityLogger.logPost('POST_CREATED', 'User created a new event post', userId, newEventPost._id, {
      postType,
      hasAttachment: !!attachmentGeneratedUrl,
      hasThumbnail: !!thumbnailGeneratedUrl,
      shareAnonymous,
      postCategoryId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (userPostDraftId) {
      await DraftEventPost.findByIdAndDelete(userPostDraftId);
    }

    const messages = {
      incident: "Event Post created successfully.",
      rescue: "Rescue initiated successfully.",
    };

    return apiResponse({
      res,
      status: true,
      message: messages[postType] || "Post created successfully.",
      statusCode: StatusCodes.CREATED,
      data: newEventPost,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to create event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const addViewToEventPost = async (req, res) => {
  const { eventPostId } = req.body;
  const userId = req.user.id;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const hasViewed = eventPost.userViews.includes(userId);

    if (!hasViewed) {
      eventPost.userViews.push(userId);
      eventPost.viewCounts += 1;

      await eventPost.save();
    }

    return apiResponse({
      res,
      status: true,
      message: "View added to event post successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to add view to event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const addViewToAttachmentFileEventPost = async (req, res) => {
  const { eventPostId, attachmentId } = req.body;
  const userId = req.user.id;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const attachment = eventPost?.attachments?.find((v)=> v?.attachmentId === attachmentId)

    if(!attachment){
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const hasViewed = attachment.attachmentViewUserIds.includes(userId);

    if (!hasViewed) {
      attachment.attachmentViewUserIds.push(userId);
      attachment.attachmentViewCounts += 1;

      await eventPost.save();
    }

    return apiResponse({
      res,
      status: true,
      message: "View added to attachment successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to add view to attachment.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const addReactionToEventPost = async (req, res) => {
  const { eventPostId } = req.body;
  const userId = req.user.id;
  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const hasReacted = eventPost.userReactions.userIds.includes(userId);

    if (!hasReacted) {
      eventPost.userReactions.userIds.push(userId);
      eventPost.reactionCounts += 1;
      await eventPost.save();
    }

    if(hasReacted) {
      eventPost.userReactions.userIds = eventPost.userReactions.userIds.filter((id) => id?.toString() !== userId?.toString());
      eventPost.reactionCounts -= 1;
      await eventPost.save();
    }
    

    return apiResponse({
      res,
      status: true,
      message: "Reaction added to event post successfully.",
      statusCode: StatusCodes.OK,
      data: {
        reactionCounts: helper.formatNumber(eventPost.reactionCounts) || "0",
        hasReacted: hasReacted ? false : true
      }
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to add reaction to event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const saveEventPost = async (req, res) => {
  const { eventPostId } = req.body;
  const userId = req.user.id;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const user = await User.findById({ _id: userId });
    const hasSaved = user.savedEventPosts.includes(eventPostId);

    if (!hasSaved) {
      user.savedEventPosts.push(eventPostId);
      await user.save();
    } else {
      user.savedEventPosts = user.savedEventPosts.filter(
        (id) => id !== eventPostId
      );
      await user.save();
    }

    const type = eventPost.postType;

    const savedMessages = {
      incident: { saved: "Event post saved successfully.", unsaved: "Event post unsaved successfully." },
      rescue: { saved: "Rescue post saved successfully.", unsaved: "Rescue post unsaved successfully." },
      general_category: { saved: "General post saved successfully.", unsaved: "General post unsaved successfully." }
    };

    const message = savedMessages[type]?.[hasSaved ? "unsaved" : "saved"] || (hasSaved ? "Post unsaved successfully." : "Post saved successfully.");

    return apiResponse({
      res,
      status: true,
      data: {
        isPostSaved: hasSaved ? false : true
      },
      message: message,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to save event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const onOffEventPostNotification = async (req, res) => {
  const { eventPostId } = req.body;
  const userId = req.user.id;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const user = await User.findById({ _id: userId });
    const hasNotificationOn = user.eventPostNotificationOnIds.includes(eventPostId);

    if (!hasNotificationOn) {
      user.eventPostNotificationOnIds.push(eventPostId);
      await user.save();
    } else {
      user.eventPostNotificationOnIds = user.eventPostNotificationOnIds.filter((id) => id !== eventPostId);
      await user.save();
    }

    return apiResponse({
      res,
      status: true,
      data: {
        isNotificationOn: hasNotificationOn ? false : true
      },
      message: hasNotificationOn
        ? "Event post notification off successfully."
        : "Event post notification on successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to notification on/off event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getSavedEventPost = async (req, res) => {
  const userId = req.user.id;
  const { postType } = req.query;

  try {
    const user = await User.findById(userId);
    let query = { _id: { $in: user.savedEventPosts } };

    if (postType) {
      const isValidPostType = await AdminEventPost.exists({ postType }).sort({createdAt: -1});
      if (isValidPostType) query.postType = postType;
    }

    const eventPosts = await AdminEventPost.find(query).sort({createdAt: -1});;

    return apiResponse({
      res,
      status: true,
      message: "Saved event posts fetched successfully.",
      data: eventPosts,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error("Error fetching saved event posts:", error);
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch saved event posts.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const checkEventPostSaved = async (req, res) => {
  const { eventPostId } = req.params;
  const userId = req.user.id;
  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    const user = await User.findById({ _id: userId });
    const hasSaved = user.savedEventPosts.includes(eventPostId);
    return apiResponse({
      res,
      status: true,
      message: hasSaved ? "Event post saved." : "Event post not saved.",
      data: hasSaved ? true : false,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to check event post saved status.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const addSharedEventPostCount = async (req, res) => {
  const { eventPostId } = req.body;
  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    eventPost.sharedCount += 1;
    await eventPost.save();

    return apiResponse({
      res,
      status: true,
      message: "shared count added to event post successfully.",
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to add shared count to event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getInThisAreaEvents = async (req, res) => {
  const { polygonCoords, postType } = req.body;
  const userId = req.user.id;
  try {
    // Get user's blocked IDs first
    const user = await User.findById({ _id: userId });
    const blockedUserIds = user.otherUserBlockIds || [];

    const events = await AdminEventPost.find({ postType: postType });

    const updatedEvents = (await filterAndUpdateEventsByTime(events, postType))?.filter((v)=>v?.status !== enums.eventPostedCurrentStatusEnum.TIMEOUT && v?.deleted?.isDeleted === false)

    // Filter out posts from blocked users
    const eventsWithoutBlockedUsers = updatedEvents.filter(event => {
      // If post has no attachments, show it
      if (!event.attachments || event.attachments.length === 0) {
        return true;
      }

      // Check each attachment
      return event.attachments.every(attachment => {
        // If attachment type is not "default", show it
        if (attachment.type !== "default") {
          return true;
        }

        // If attachment has no userId, show it
        if (!attachment.userId) {
          return true;
        }

        // If attachment's userId is not in blocked list, show it
        return !blockedUserIds.includes(attachment.userId.toString());
      });
    });

    const eventsInsidePolygon = helper.getEventsInsidePolygon(polygonCoords, eventsWithoutBlockedUsers);

    const eventInteractions = eventsInsidePolygon.map((item) => {
      const userViews = Array.isArray(item.userViews) && item.userViews.includes(userId) ? 1 : 0;

      const userComments = Array.isArray(item.userComments) ? item.userComments.filter((comment) => comment.userId.toString() === userId).length : 0;

      const userReactions = Array.isArray(item.userReactions?.userIds) && item.userReactions.userIds.includes(userId) ? 1 : 0;

      const userTotalInteractions = userViews + userComments + userReactions;

      return {
        ...item._doc,
        userTotalInteractions,
      };
    });

    // Get total interactions across all events to normalize the percentage 
    const totalInteractionsAcrossAllEvents =
    eventInteractions.reduce( (sum, item) => sum + item.userTotalInteractions, 0 ) || 1;

    const eventsWithDetails = await Promise.all((eventInteractions || []).sort((a, b) => b.userTotalInteractions - a.userTotalInteractions).map(async (item) => {
      const distance = helper.calculateGeodesicDistance(item.latitude, item.longitude, user.latitude, user.longitude)
      const attachmentFileType = helper.getFileType(item.attachments[0]?.attachment);
      let postCategoryDetails = null;
      if (item.postCategoryId) {
        postCategoryDetails = await AdminEventType.findById({_id: item.postCategoryId});
      }

      const userInteractionPercentage = ((item.userTotalInteractions / totalInteractionsAcrossAllEvents) * 100).toFixed(2);

      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        eventTime: item.eventTime,
        attachment: item.attachments[0]?.attachment,
        latitude: item.latitude,
        longitude: item.longitude,
        thumbnail: item.attachments[0]?.thumbnail,
        postCategory: item.postCategory,
        viewCounts: helper.formatNumber(item.viewCounts) || "0",
        distance: `${distance.toFixed(2)} km`,
        status: item?.status,
        attachmentFileType: attachmentFileType,
        postCategoryName: postCategoryDetails?.eventName || null,
        reactionCounts: helper.formatNumber(item?.reactionCounts) || "0",
        userInteractionPercentage: Number(userInteractionPercentage),
      }
    }));

    return apiResponse({
      res,
      status: true,
      message: "Events fetched successfully.",
      data: {
        eventCounts: eventsWithDetails?.length,
        data: eventsWithDetails
      },
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch events.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getNearbyEventsForEventPost = async (req, res) => {
  const { eventPostId } = req.params;
  const userId = req.user.id;

  try {
    // Get user's blocked IDs first
    const user = await User.findById({ _id: userId });
    const blockedUserIds = user.otherUserBlockIds || [];

    const events = await AdminEventPost.find({});
    const getSingleEvent = events.find((event) => event._id == eventPostId);

    if (!getSingleEvent) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const updatedEvents = (await filterAndUpdateEventsByTime(events, getSingleEvent?.postType))?.filter((v)=>v?.status !== enums.eventPostedCurrentStatusEnum.TIMEOUT && v?.deleted?.isDeleted === false)

    // Filter out posts from blocked users
    const eventsWithoutBlockedUsers = updatedEvents.filter(event => {
      // If post has no attachments, show it
      if (!event.attachments || event.attachments.length === 0) {
        return true;
      }

      // Check each attachment
      return event.attachments.every(attachment => {
        // If attachment type is not "default", show it
        if (attachment.type !== "default") {
          return true;
        }

        // If attachment has no userId, show it
        if (!attachment.userId) {
          return true;
        }

        // If attachment's userId is not in blocked list, show it
        return !blockedUserIds.includes(attachment.userId.toString());
      });
    });

    const { latitude: eventLat, longitude: eventLong } = getSingleEvent;

    if (!eventLat || !eventLong) {
      return apiResponse({
        res,
        status: false,
        message: "Event location is not specified.",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const sortedEvents = eventsWithoutBlockedUsers.map((event) => {
      if (event._id == eventPostId || !event.latitude || !event.longitude) return null;

      const distance = helper.calculateGeodesicDistance(eventLat, eventLong, event.latitude, event.longitude);
      return { event, distance };
    }).filter((event) => event !== null).sort((a, b) => a.distance - b.distance);

    const filterPostTypeData = (sortedEvents || []).filter((v)=> v.event.postType === getSingleEvent.postType)

    const nearbyEventsWithDetails = filterPostTypeData.map((item) => {
      const attachmentFileType = helper.getFileType(item.event.attachments[0]?.attachment);
      return {
        _id: item.event._id,
        title: item.event.title,
        description: item.event.description,
        eventTime: item.event.eventTime,
        attachment: item.event.attachments[0]?.attachment,
        thumbnail: item.event.attachments[0]?.thumbnail,
        distance: `${item.distance.toFixed(2)} km`,
        latitude: item.event.latitude,
        longitude: item.event.longitude,
        postCategory: item.event.postCategory,
        viewCounts: helper.formatNumber(item.event.viewCounts) || "0",
        status: item.event?.status,
        attachmentFileType: attachmentFileType
      }
    });

    return apiResponse({
      res,
      status: true,
      message: "Nearby events fetched successfully.",
      data: nearbyEventsWithDetails,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "An error occurred while fetching nearby events.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const eventPostRescueUpdate = async (req, res) => {
  const { eventPostId, longitude, latitude, description, address, countryCode, mobileNumber, eventTime } = req.body;

  const { attachment, thumbnail } = req.files;
  const userId = req.user.id;

  let attachmentUrl = null;
  let thumbnailUrl = null;

  if (!attachment && !attachment[0]) {
    return apiResponse({
      res,
      status: false,
      message: "attachment is required",
      body: null,
    });
  }

  if (!thumbnail && !thumbnail[0]) {
    return apiResponse({
      res,
      status: false,
      message: "thumbnail is required",
      body: null,
    });
  }

  try {
    const eventPost = await AdminEventPost.findById(eventPostId);

    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    if(attachment && attachment[0]) {
      attachmentUrl = await helper.uploadMediaInS3Bucket(attachment[0], config.mediaFolderEnum.RESCUE_UPDATE);
    }

    if (thumbnail && thumbnail[0]) {
      thumbnailUrl = await helper.uploadMediaInS3Bucket(thumbnail[0], config.mediaFolderEnum.RESCUE_UPDATE);
    }

    const rescueUpdate = {
      userId,
      longitude,
      latitude,
      attachment: attachmentUrl,
      thumbnail: thumbnailUrl,
      description,
      address,
      countryCode,
      mobileNumber,
      eventTime,
      status: enums.eventPostStatusEnum.PENDING,
    };

    eventPost.rescueUpdates.push(rescueUpdate);
    
    await eventPost.save();

    return apiResponse({
      res,
      status: true,
      message: "Rescue updated successfully.",
      data: eventPost,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Rescue update failed.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getAllEventPostNews = async (req, res) => {
  const userId = req.user.id;
  const { filterType, postType, search, page = 1, limit = 10 } = req.query;

  try {
    // Get user's blocked IDs first
    const user = await User.findById(userId);
    const blockedUserIds = user.otherUserBlockIds || [];
    console.log("blockedUserIds", blockedUserIds)

    let filter = { 'deleted.isDeleted': false };

    // Apply search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (postType) {
      const postTypeExists = await AdminEventPost.exists({ postType });
      if (postTypeExists) filter.postType = postType;
    }

    // Sorting logic based on filterType
    let sortQuery = { eventTime: -1 };
    if (filterType === "trending") {
      sortQuery = { viewCounts: -1 };
    }

    if (filterType === "myFeed") {
      filter.$or = [
        { userViews: userId },
        { "userComments.userId": userId },
        { "userReactions.userIds": userId },
      ];
    }

    // Pagination calculations
    const { skip, limit: parsedLimit } = paginationFun({ page, limit });

    // Get total item count
    const totalItems = await AdminEventPost.countDocuments(filter);
    console.log("totalItems", totalItems)

    // Get all posts first to filter blocked users
    let allPosts = await AdminEventPost.find(filter).lean();

    // Filter out posts where attachment's userId matches blocked user IDs
    const filteredPosts = allPosts.filter(post => {
      // If post has no attachments, show it
      if (!post.attachments || post.attachments.length === 0) {
        return true;
      }

      // Check each attachment
      return post.attachments.every(attachment => {
        // If attachment type is not "default", show it
        if (attachment.type !== "default") {
          return true;
        }

        // If attachment has no userId, show it
        if (!attachment.userId) {
          return true;
        }

        // If attachment's userId is not in blocked list, show it
        return !blockedUserIds.includes(attachment.userId.toString());
      });
    });

    // Get actual total filtered items count
    const totalFilteredItems = filteredPosts.length;
    console.log("totalFilteredItems", totalFilteredItems);

    // Apply sorting and pagination to filtered posts
    let sortedPosts = filteredPosts;
    if (filterType === "myFeed") {
      sortedPosts = filteredPosts.map((post) => {
        const userViewsCount = post.userViews?.filter((id) => id.toString() === userId).length || 0;
        const userCommentsCount = post.userComments?.filter((comment) => comment.userId.toString() === userId).length || 0;
        const userReactionsCount = post.userReactions?.userIds?.filter((id) => id.toString() === userId).length || 0;

        return {
          ...post,
          userInteractions: userViewsCount + userCommentsCount + userReactionsCount,
        };
      }).sort((a, b) => b.userInteractions - a.userInteractions);
    } else {
      sortedPosts = filteredPosts.sort((a, b) => {
        if (filterType === "trending") {
          return b.viewCounts - a.viewCounts;
        }
        return new Date(b.eventTime) - new Date(a.eventTime);
      });
    }

    // Apply pagination
    const { skip: sortedSkip, limit: sortedParsedLimit } = paginationFun({ page, limit });
    const paginatedPosts = sortedPosts.slice(sortedSkip, sortedSkip + sortedParsedLimit);

    const filterEventPostNews = await Promise.all(
      paginatedPosts.map(async (item) => {
        const distance = helper.calculateGeodesicDistance(
          item.latitude,
          item.longitude,
          user.latitude,
          user.longitude
        );

        // Get attachment users' details
        const attachmentsWithUserDetails = await Promise.all(
          (item.attachments || []).map(async (attachment) => {
            let userData = null;
            if (attachment.userId) {
              userData = await User.findById(attachment.userId).select("name profilePicture username");
            }

            const attachmentFileType = helper.getFileType(attachment.attachment);

            return {
              attachment: attachment.attachment,
              isSensitiveContent: attachment?.isSensitiveContent,
              isShareAnonymously : attachment?.isShareAnonymously,
              userId: attachment?.userId || null,
              name: userData?.name || null,
              username: userData?.username || null,
              profilePicture: userData?.profilePicture || null,
              attachmentFileType: attachmentFileType,
              attachmentViewCounts: helper.formatNumber(attachment?.attachmentViewCounts) || "0",
              thumbnail: attachmentFileType === "Image" ? attachment.attachment : attachment.thumbnail,
            };
          })
        );

        const hasReacted = item.userReactions.userIds.includes(userId);

        return {
          _id: item._id,
          title: item.title,
          description: item.description,
          latitude: item.latitude,
          longitude: item.longitude,
          eventTime: item.eventTime,
          viewCounts: helper.formatNumber(item.viewCounts),
          commentCounts: helper.formatNumber(item.commentCounts),
          reactionCounts: helper.formatNumber(item.reactionCounts),
          reactionIcon: item.userReactions?.reactionIcon ? item.userReactions.reactionIcon : item.postCategory ? item.postCategory : null,
          postType: item.postType,
          status: item?.status,
          distance: `${distance.toFixed(2)} km`,
          attachments: attachmentsWithUserDetails,
          hasReacted
        };
      })
    );

    // Pagination details
    const pagination = paginationDetails({
      page,
      totalItems: totalFilteredItems,
      limit: parsedLimit,
    });

    return apiResponse({
      res,
      status: true,
      message: "Event post news fetched successfully.",
      data: {
        page: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        limit: pagination.limit,
        data: filterEventPostNews,
      },
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log("error", error);
    return apiResponse({
      res,
      status: false,
      message: "Event post news fetching failed.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getEventPostComments = async(req, res) => {
  const { eventPostId } = req.params;
  const userId = req.user.id;
  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId })

    const transformedComments = await helper.transformComments(eventPost.userComments, userId);

    return apiResponse({
      res,
      status: true,
      message: "Event post comments fetched successfully.",
      data: transformedComments,
      statusCode: StatusCodes.OK,
    })

  } catch(error) {
    return apiResponse({
      res,
      status: false,
      message: "Event post comments fetching failed.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
}

const searchEventsByHashTag = async (req, res) => {
  const { postType, hashTag } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById({ _id: userId });

    const events = await AdminEventPost.find({
      postType: postType,
      hashTags: { $regex: hashTag, $options: "i" },
      "deleted.isDeleted": false,
      // status: { $ne: enums.eventPostedCurrentStatusEnum.TIMEOUT }
    }).sort({ eventTime: -1 }).exec();

    const updatedEvents = await filterAndUpdateEventsByTime(events, postType);

    const filteredEvents = (updatedEvents || []).map((item) => {
      const distance = helper.calculateGeodesicDistance(
        item.latitude,
        item.longitude,
        user.latitude,
        user.longitude
      );

     const attachmentFileType = helper.getFileType(item.attachments[0].attachment);
      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        eventTime: item.eventTime,
        attachment: item.attachments[0].attachment,
        latitude: item.latitude,
        longitude: item.longitude,
        thumbnail: item.attachments[0].thumbnail,
        postCategory: item.postCategory,
        viewCounts: helper.formatNumber(item.viewCounts) || "0",
        distance: `${distance.toFixed(2)} km`,
        status: item?.status,
        hashTags: item.hashTags,
        attachmentFileType: attachmentFileType
      };
    });

    return apiResponse({
      res,
      status: true,
      message: "Events fetched successfully.",
      data: filteredEvents,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch events.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getSingleEventPost = async (req, res) => {
  const { eventPostId } = req.params;
  const userId = req.user.id;

  try {
    const eventPost = await AdminEventPost.findById({ _id: eventPostId });
    const user = await User.findById({ _id: userId });
    let isPostSaved = false
    let isNotificationOn = false
    let hasReacted = false
    if(user?.savedEventPosts?.includes(eventPostId)){
      isPostSaved = true
    }
    if(user?.eventPostNotificationOnIds?.includes(eventPostId)){
      isNotificationOn = true
    }
    if(eventPost?.userReactions.userIds.includes(userId)){
      hasReacted = true
    }
    
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const distance = helper.calculateGeodesicDistance(
      eventPost.latitude,
      eventPost.longitude,
      user.latitude,
      user.longitude
    );

    // Get attachment users' details
    const attachmentsWithUserDetails = await Promise.all((eventPost.attachments || []).map(async (attachment) => {
        let userData = null;
        if (attachment.userId) {
          userData = await User.findById(attachment.userId).select("name profilePicture username");
        }
        const attachmentFileType = helper.getFileType(attachment.attachment);

        return {
          userId: attachment?.userId || null,
          eventTime: attachment.eventTime,
          type: attachment.type,
          title: attachment.title,
          attachment: attachmentFileType === "Image" ?  attachment?.thumbnail : attachment.attachment,
          thumbnail: attachment?.thumbnail,
          description: attachment.description,
          attachmentId: attachment.attachmentId,
          name: userData?.name || null,
          profilePicture: userData?.profilePicture || null,
          username: userData?.username || null,
          isSensitiveContent: attachment.isSensitiveContent || false,
          attachmentFileType: attachmentFileType,
          attachmentViewCounts: helper.formatNumber(attachment?.attachmentViewCounts) || "0"
        };
      })
    );

    
    let postMainCategoryDetails = null;
    let postSubCategoryDetails = null
    if (eventPost.mainCategoryId) {
      postMainCategoryDetails = await AdminEventType.findById({ _id: eventPost.mainCategoryId });
      postSubCategoryDetails = postMainCategoryDetails?.subCategories?.find((v) => v._id.toString() === eventPost.subCategoryId?.toString());
    }
  
    const eventPostData = {
      _id: eventPost._id,
      title: eventPost.title,
      description: eventPost.description,
      latitude: eventPost.latitude,
      longitude: eventPost.longitude,
      eventTime: eventPost.eventTime,
      viewCounts: helper.formatNumber(eventPost.viewCounts) || "0",
      commentCounts: helper.formatNumber(eventPost.commentCounts) || "0",
      reactionCounts: helper.formatNumber(eventPost.reactionCounts) || "0",
      sharedCount: helper.formatNumber(eventPost.sharedCount) || "0",
      notifiedUserCount: helper.formatNumber(eventPost.notifiedUserCount) || "0",
      hashTags: eventPost.hashTags,
      lostItemName: eventPost.lostItemName,
      countryCode: eventPost.countryCode,
      mobileNumber: eventPost.mobileNumber,
      address: eventPost.address,
      postCategory: eventPost.postCategory,
      mainCategory: postMainCategoryDetails ? {
        _id: postMainCategoryDetails?._id || null,
        eventName: postMainCategoryDetails?.eventName || null,
        eventIcon: postMainCategoryDetails?.eventIcon || null,
      } : null,
      subCategory: postSubCategoryDetails ? {
        _id: postSubCategoryDetails?._id || null,
        eventName: postSubCategoryDetails?.eventName || null,
        eventIcon: postSubCategoryDetails?.eventIcon || null,
      } : null,
      postType: eventPost.postType,
      status: eventPost?.status,
      reactionIcon: eventPost.userReactions?.reactionIcon ? eventPost.userReactions.reactionIcon : eventPost.postCategory ? eventPost.postCategory : null,
      distance: `${distance.toFixed(2)} km`,
      attachments: attachmentsWithUserDetails,
      timeLines: eventPost.timeLines || [],
      rescueUpdates: eventPost.rescueUpdates || [],
      isPostSaved,
      isNotificationOn,
      hasReacted
    };

    return apiResponse({
      res,
      status: true,
      message: "Event post fetched successfully.",
      data: eventPostData,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log(error);
    
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getAllAdminEventPosts = async (req, res) => {
  const userId = req.user.id;
  const { postType } = req.query; 
  const filter = {};
  try {
    const user = await User.findById({ _id: userId })

    if (postType) {
      const postTypeExists = await AdminEventPost.exists({ postType }).sort({createdAt: -1});
      if (postTypeExists) filter.postType = postType;
    }

    const events = await AdminEventPost.find(filter).sort({createdAt: -1});

    const filteredEvents = await Promise.all((events || []).map(async (item) => {
      const distance = helper.calculateGeodesicDistance(item.latitude, item.longitude, user.latitude, user.longitude)
      const attachmentFileType = helper.getFileType(item.attachments[0].attachment);
      let postCategoryDetails = null;
      if (item.postCategoryId) {
        postCategoryDetails = await AdminEventType.findById({_id: item.postCategoryId}).sort({createdAt: -1});;
      }

      return {
        _id: item._id,
        title: item.title,
        description: item.description,
        eventTime: item.eventTime,
        attachment: item.attachments[0].attachment,
        latitude: item.latitude,
        longitude: item.longitude,
        thumbnail: item.attachments[0].thumbnail,
        postCategory: item.postCategory,
        viewCounts: helper.formatNumber(item.viewCounts) || "0",
        distance: `${distance.toFixed(2)} km`,
        status: item?.status,
        attachmentFileType: attachmentFileType,
        postCategoryName: postCategoryDetails?.eventName || null,
      }
    }));

    return apiResponse({
      res,
      status: true,
      message: "Events fetched successfully.",
      data: filteredEvents,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.log("error", error)
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch eventsssssss.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getEventCategoryList = async (req, res) => {
  const { search, postType } = req.query;
  const { id } = req.params;  
  try {
    let query = {};
    if (id) query._id = id;
    if (search)  query.eventName = { $regex: search, $options: "i" };
    if(postType === enums.eventPostTypeEnum.GENERAL_CATEGORY) query.postType = postType;

    const eventTypes = await AdminEventType.find(query).sort({createdAt: -1});

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
    console.log("errrrr", error)
    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch event types.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getPublicEventPosts = async (req, res) => {
  const { eventPostId } = req.params;

  try {
    const eventPost = await AdminEventPost.findById(eventPostId);
    
    if (!eventPost) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    // Get attachment users' details
    const attachmentsWithUserDetails = await Promise.all(
      (eventPost.attachments || []).map(async (attachment) => {
        let userData = null;
        if (attachment.userId) {
          userData = await User.findById(attachment.userId).select("name profilePicture username");
        }
        const attachmentFileType = helper.getFileType(attachment.attachment);

        return {
          userId: attachment?.userId || null,
          eventTime: attachment.eventTime,
          type: attachment.type,
          title: attachment.title,
          attachment: attachmentFileType === "Image" ? attachment?.thumbnail : attachment.attachment,
          thumbnail: attachment?.thumbnail,
          description: attachment.description,
          attachmentId: attachment.attachmentId,
          name: userData?.name || null,
          profilePicture: userData?.profilePicture || null,
          username: userData?.username || null,
          isSensitiveContent: attachment.isSensitiveContent || false,
          attachmentFileType: attachmentFileType,
          attachmentViewCounts: helper.formatNumber(attachment?.attachmentViewCounts) || "0",
        };
      })
    );

    // const distance = helper.calculateGeodesicDistance(
    //   eventPost.latitude,
    //   eventPost.longitude,
    //   user.latitude,
    //   user.longitude
    // );

    const eventPostData = {
      _id: eventPost._id,
      title: eventPost.title,
      description: eventPost.description,
      latitude: eventPost.latitude,
      longitude: eventPost.longitude,
      eventTime: eventPost.eventTime,
      viewCounts: helper.formatNumber(eventPost.viewCounts) || "0",
      commentCounts: helper.formatNumber(eventPost.commentCounts) || "0",
      reactionCounts: helper.formatNumber(eventPost.reactionCounts) || "0",
      sharedCount: helper.formatNumber(eventPost.sharedCount) || "0",
      notifiedUserCount: helper.formatNumber(eventPost.notifiedUserCount) || "0",
      hashTags: eventPost.hashTags,
      lostItemName: eventPost.lostItemName,
      countryCode: eventPost.countryCode,
      mobileNumber: eventPost.mobileNumber,
      address: eventPost.address,
      postCategory: eventPost.postCategory,
      postType: eventPost.postType,
      // distance: `${distance.toFixed(2)} km`,
      reactionIcon: eventPost.userReactions?.reactionIcon
        ? eventPost.userReactions.reactionIcon
        : eventPost.postCategory
        ? eventPost.postCategory
        : null,
      attachments: attachmentsWithUserDetails,
      timeLines: eventPost.timeLines || [],
      rescueUpdates: eventPost.rescueUpdates || [],
    };

    return apiResponse({
      res,
      status: true,
      message: "Event post fetched successfully.",
      data: eventPostData,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    console.error(error);

    return apiResponse({
      res,
      status: false,
      message: "Failed to fetch event post.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

const getNearbyEventsForPublicEventPost = async (req, res) => {
  const { eventPostId } = req.params;
  try {
    const events = await AdminEventPost.find({}).sort({createdAt: -1});
    const getSingleEvent = events.find((event) => event._id == eventPostId);

    if (!getSingleEvent) {
      return apiResponse({
        res,
        status: false,
        message: "Event post not found.",
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const updatedEvents = (await filterAndUpdateEventsByTime(events, getSingleEvent?.postType))?.filter((v)=>v?.status !== enums.eventPostedCurrentStatusEnum.TIMEOUT && v?.deleted?.isDeleted === false)

    const { latitude: eventLat, longitude: eventLong } = getSingleEvent;

    if (!eventLat || !eventLong) {
      return apiResponse({
        res,
        status: false,
        message: "Event location is not specified.",
        statusCode: StatusCodes.BAD_REQUEST,
      });
    }

    const sortedEvents = updatedEvents.map((event) => {
      if (event._id == eventPostId || !event.latitude || !event.longitude) return null;

      const distance = helper.calculateGeodesicDistance(eventLat, eventLong, event.latitude, event.longitude);
      return { event, distance };
    }).filter((event) => event !== null).sort((a, b) => a.distance - b.distance);

    const filterPostTypeData = (sortedEvents || []).filter((v)=> v.event.postType === getSingleEvent.postType)

    const filteredEvents = filterPostTypeData.map((item) => {
      const attachmentFileType = helper.getFileType(item.event.attachments[0]?.attachment);
      return {
        _id: item.event._id,
        title: item.event.title,
        description: item.event.description,
        eventTime: item.event.eventTime,
        attachment: item.event.attachments[0]?.attachment,
        thumbnail: item.event.attachments[0]?.thumbnail,
        distance: `${item.distance.toFixed(2)} km`,
        latitude: item.event.latitude,
        longitude: item.event.longitude,
        postCategory: item.event.postCategory,
        viewCounts: helper.formatNumber(item.event.viewCounts) || "0",
        status: item.event?.status,
        attachmentFileType: attachmentFileType
      }
    });

    return apiResponse({
      res,
      status: true,
      message: "Nearby events fetched successfully.",
      data: filteredEvents,
      statusCode: StatusCodes.OK,
    });
  } catch (error) {
    return apiResponse({
      res,
      status: false,
      message: "An error occurred while fetching nearby events.",
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};


export default {
  createUserEventPost,
  addViewToEventPost,
  addViewToAttachmentFileEventPost,
  addReactionToEventPost,
  saveEventPost,
  getSavedEventPost,
  checkEventPostSaved,
  addSharedEventPostCount,
  getInThisAreaEvents,
  getNearbyEventsForEventPost,
  eventPostRescueUpdate,
  getAllEventPostNews,
  getEventPostComments,
  searchEventsByHashTag,
  getSingleEventPost,
  getAllAdminEventPosts,
  onOffEventPostNotification,
  getEventCategoryList,
  getPublicEventPosts,
  getNearbyEventsForPublicEventPost
};
