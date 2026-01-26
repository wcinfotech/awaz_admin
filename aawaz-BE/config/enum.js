const nodeEnvEnums = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
};

const authProviderEnum = {
  GOOGLE: "google",
  APPLE: "apple",
  EMAIL: "email",
  MOBILE: "mobile",
  GUEST: "guest"
};

const userRoleEnum = {
  USER: "user",
  ADMIN: "admin",
  OWNER: "owner",
  GUEST: "guest",
};

const eventPostStatusEnum = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const statusEnum = {
  OPEN: "open",
  CLOSE: "close",
};

const mediaFolderEnum = {
  EVENT_POST: "event-post",
  PROFILE_PICTURE: "profile-picture",
  EVENT_TYPE: "event-type",
  EVENT_REACTION: "event-reaction",
  RESCUE_UPDATE: "rescue-updates",
  DRAFT_POST: "admin-post",
  DRAFT_ADMIN_POST: "admin-draft-post"
};

const socketEventEnum = {
  SEND_EVENT_POST_COMMENT: "sendEventPostComment",
  SEND_EVENT_POST_COMMENT_REPLY: "sendEventPostCommentReply",
  LIKE_EVENT_POST_COMMENT: "likeEventPostComment",
  LIKE_EVENT_POST_COMMENT_REPLY: "likeEventPostCommentReply",
  DELETE_EVENT_POST_COMMENT: "deleteEventPostComment",
  DELETE_EVENT_POST_COMMENT_REPLY: "deleteEventPostCommentReply",
  RECEIVE_EVENT_POST_COMMENT: "receiveEventPostComment",
  UNLIKE_EVENT_POST_COMMENT: "unlikeEventPost",
  UNLIKE_EVENT_POST_COMMENT_REPLY: "unlikeEventPostComment",
  TYPING: "TYPING",
  START_TYPING: "START_TYPING",
  STOP_TYPING: "STOP_TYPING",
  SEND_MESSAGE: "SEND_MESSAGE",
  RECEIVE_MESSAGE: "RECEIVE_MESSAGE",
  USER_CHATS: "USER_CHATS",
  ERROR: "ERROR",
  CHAT_NOT_FOUND: "CHAT_NOT_FOUND",
  FETCH_SINGLE_CHAT: "FETCH_SINGLE_CHAT",
  FETCH_USER_CHATS: "FETCH_USER_CHATS",
  REQUEST_REJECTED: "REQUEST_REJECTED",
  HANDLE_REQUEST: "HANDLE_REQUEST",
  RECEIVE_SINGLE_CHAT: "RECEIVE_SINGLE_CHAT",
  REQUEST_RECEIVED: "REQUEST_RECEIVED",
  REQUEST_ACCEPTED: "REQUEST_ACCEPTED",
  GET_UNREAD_STATS: "GET_UNREAD_STATS",
  UNREAD_STATS: "UNREAD_STATS",
};

const eventPostTypeEnum = {
  INCIDENT: "incident",
  RESCUE: "rescue",
  GENERAL_CATEGORY: "general_category"
};

const eventPostTimelineTypeEnum = {
  DEFAULT: "default",
  UPLOAD: "upload",
  TIMELINE: "timeline",
  TIMELINE_WITH_UPLOAD: "timeline-with-upload"
}

const reportTypeEnum = {
  USER: "user",
  POST: "post",
  COMMENT: "comment",
  COMMENT_REPLY: "comment-reply",
};

const eventPostedCurrentStatusEnum = {
  PENDING: "Pending",
  RESOLVED: "Resolved",
  TIMEOUT: "Timeout"
}

const ownerApproveStatusEnum = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const chatRequestStatusEnum = {
  PENDING: "Pending",
  APPROVED: "Accepted",
  REJECTED: "Rejected",
};

export default { nodeEnvEnums, authProviderEnum, userRoleEnum, eventPostStatusEnum, statusEnum, mediaFolderEnum, socketEventEnum, eventPostTypeEnum, eventPostTimelineTypeEnum, reportTypeEnum, eventPostedCurrentStatusEnum, ownerApproveStatusEnum, chatRequestStatusEnum };
