import enums from "../config/enum.js";
import helper from "../helper/common.js";

const mergeAttachmentsAndTimeLines = (attachments, timeLines) => {
  const mergedDataMap = new Map();

  const standardizeObject = (obj) => {
    const attachmentFileType = helper.getFileType(obj?.attachment);
    const standardizedObj = {
      eventTime: obj.eventTime || null,
      description: obj.description || null,
      attachmentId: obj.attachmentId || null,
      address: obj.address || null,
      name: obj.name || null,
      profilePicture: obj.profilePicture || null,
      userId: obj.userId || null,
      type: obj.type || "timeline",
      attachment: obj?.attachment || null,
      thumbnail: obj?.thumbnail || null,
      countryCode: obj.countryCode || null,
      mobileNumber: obj.mobileNumber || null,
      attachmentFileType: attachmentFileType,
    };

    return standardizedObj;
  };

  // First add attachments to the map
  // attachments.forEach((attachment) => {
  //   const standardizedAttachment = standardizeObject({...attachment, type: "upload"});
  //   mergedDataMap.set(standardizedAttachment.attachmentId, standardizedAttachment);
  // });

  attachments.forEach((attachment) => {
    const standardizedAttachment = standardizeObject(attachment);
    mergedDataMap.set(
      standardizedAttachment.attachmentId,
      standardizedAttachment
    );
  });

  //   timeLines.forEach((timeLine) => {
  //     const standardizedTimeLine = standardizeObject(timeLine);
  //     if (mergedDataMap.has(standardizedTimeLine.attachmentId)) {
  //       const existing = mergedDataMap.get(standardizedTimeLine.attachmentId);
  //       existing.type = existing.type || "timeline";
  //       mergedDataMap.set(standardizedTimeLine.attachmentId, existing);
  //     } else {
  //       mergedDataMap.set(standardizedTimeLine.attachmentId, standardizedTimeLine);
  //     }
  //   });

  timeLines.forEach((timeLine) => {
    const standardizedTimeLine = standardizeObject(timeLine);
    if (mergedDataMap.has(standardizedTimeLine.attachmentId)) {
      const existing = mergedDataMap.get(standardizedTimeLine.attachmentId);
      mergedDataMap.set(standardizedTimeLine.attachmentId, {
        ...existing,
        eventTime: standardizedTimeLine.eventTime || existing.eventTime,
        description: standardizedTimeLine.description || existing.description,
        address: standardizedTimeLine.address || existing.address,
        countryCode: standardizedTimeLine.countryCode || existing.countryCode,
        mobileNumber:
          standardizedTimeLine.mobileNumber || existing.mobileNumber,
        type: "timeline",
      });
    } else {
      mergedDataMap.set(
        standardizedTimeLine.attachmentId,
        standardizedTimeLine
      );
    }
  });

  const filterData = Array.from(mergedDataMap.values()).filter(
    (v) => v.type !== enums.eventPostTimelineTypeEnum.DEFAULT
  );

  return filterData;
};

export const filterEventPostData = (eventPost) => {
  return eventPost.map((post) => ({
    _id: post._id,
    longitude: post.longitude,
    latitude: post.latitude,
    title: post.title,
    description: post.description,
    eventTime: post.eventTime,
    viewCounts: post.viewCounts,
    commentCounts: post.commentCounts,
    reactionCounts: post.reactionCounts,
    hashTags: post.hashTags,
    sharedCount: post.sharedCount,
    notifiedUserCount: post.notifiedUserCount,
    lostItemName: post.lostItemName,
    countryCode: post.countryCode,
    mobileNumber: post.mobileNumber,
    address: post.address,
    postCategory: post.postCategory,
    reactionIcon: post.userReactions?.reactionIcon || null,
    reactionId: post.userReactions?.reactionId || null,
    attachment: post.attachments[0]?.attachment,
    attachmentFileType: helper.getFileType(post.attachments[0]?.attachment),
    thumbnail: post.attachments[0]?.thumbnail,
    userId: post.attachments[0]?.userId?._id || post.attachments[0]?.userId,
    name: post.attachments[0]?.userId?.name || post.attachments[0]?.name,
    username: post.attachments[0]?.userId?.username,
    profilePicture: post.attachments[0]?.userId?.profilePicture || post.attachments[0]?.profilePicture,
    status: post.status,
    timeLines: post.timeLines || [],
    postCategoryId: post.postCategoryId || null,
    mainCategoryId: post.mainCategoryId || null,
    subCategoryId: post.subCategoryId || null,
    attachments: (post.attachments || []).map((attachment) => ({
      title: attachment.title,
      attachment: attachment.attachment,
      description: attachment.description,
      attachmentId: attachment.attachmentId,
      name: attachment.userId?.name || attachment.name || null,
      username: attachment.userId?.username || null,
      profilePicture: attachment.userId?.profilePicture || attachment.profilePicture || null,
      isSensitiveContent: attachment.isSensitiveContent || false,
      thumbnail: attachment.thumbnail || null,
      eventTime: attachment.eventTime || null,
    })),
    attachmentWithTimeline: mergeAttachmentsAndTimeLines(
      post.attachments,
      post.timeLines
    ),
  }));
};

// Common function to filter and update event statuses
export const filterAndUpdateEventsByTime = (events, postType) => {
  const timeLimit = postType === enums.eventPostTypeEnum.INCIDENT ? 24 : 48;
  const currentTime = new Date();

  return Promise.all(
    events.map(async (event) => {
      const eventTime = new Date(event.createdAt);
      const timeDifference = (currentTime - eventTime) / (1000 * 60 * 60);
      if (
        event.status === enums.eventPostedCurrentStatusEnum.PENDING &&
        timeDifference > timeLimit
      ) {
        event.status = enums.eventPostedCurrentStatusEnum.TIMEOUT;
        await event.save();
      }
      return event;
    })
  );
};

export const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const updateTimedOutEvents = (events) => {
  const timeLimit = 48;
  const currentTime = new Date();

  return Promise.all(
    events.map(async (event) => {
      const eventTime = new Date(event.createdAt);
      const timeDifference = (currentTime - eventTime) / (1000 * 60 * 60);

      if (
        event.status === enums.eventPostedCurrentStatusEnum.PENDING &&
        timeDifference > timeLimit
      ) {
        event.status = enums.eventPostedCurrentStatusEnum.TIMEOUT;
        await event.save();
      }

      return event;
    })
  );
};
