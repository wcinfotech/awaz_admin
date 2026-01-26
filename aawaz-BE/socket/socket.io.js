import { Server } from "socket.io";
import mongoose from "mongoose";
import AdminEventPost from "../admin-panel/models/admin-event-post.model.js";
import enums from "../config/enum.js";
import User from "../models/user.model.js";
import { corsConfig } from "./utils.socket.js";
import helper from "../helper/common.js";
import MessageRequest from "./requests.schema.js";
import Chat from "./chat.schema.js";

export const initializeSocketIO = (server) => {
  const io = new Server(server, corsConfig);
  
  io.use((socket, next) => {
    const userId =
      socket.handshake.auth?.token || socket.handshake.query?.userId;

    socket.user = {
      _id: userId,
    };

    next();
  });

  io.on("connection", (socket) => {
    console.log("connectedddddd")
    if(socket && socket.user && socket.user._id){
      console.log(`⚡ New user connected: ${socket.id} | UserID: ${socket.user._id}`);
      socket.join(socket.user._id.toString());
    }

    // Send event post comment
    socket.on(enums.socketEventEnum.SEND_EVENT_POST_COMMENT, async (data) => {
      const { eventPostId, comment, userId } = data;
      const user = await User.findById(userId);
      const timestamp = new Date();
      const eventPost = await AdminEventPost.findById(eventPostId);
      if (eventPost) {
        eventPost.userComments.push({ userId: user._id, comment, timestamp, likes: [], isDeleted: false, replies: [] });
        eventPost.commentCounts++;
        await eventPost.save();
        const transformedComments = await helper.transformComments(eventPost.userComments, userId);
        io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
      }
    });

    // Send event post comment reply
    socket.on(enums.socketEventEnum.SEND_EVENT_POST_COMMENT_REPLY, async (data) => {
      const { eventPostId, commentId, commentReply, userId } = data;
      const user = await User.findById(userId);
      const timestamp = new Date();
      const eventPost = await AdminEventPost.findById(eventPostId);
      if (eventPost) {
        const comment = eventPost.userComments.id(commentId);
        if (comment) {
          comment.replies.push({ userId: user._id, comment: commentReply, timestamp, likes: [], isDeleted: false });
          await eventPost.save();
          const transformedComments = await helper.transformComments(eventPost.userComments, userId);
          io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
        }
      }
    });

    // Like event post comment
    socket.on(enums.socketEventEnum.LIKE_EVENT_POST_COMMENT, async (data) => {
      const { eventPostId, commentId, userId } = data;
      const eventPost = await AdminEventPost.findById(eventPostId);
      if (eventPost) {
        const comment = eventPost.userComments.id(commentId);
        if (comment) {
          comment.likes.push(userId);
          await eventPost.save();
          const transformedComments = await helper.transformComments(eventPost.userComments, userId);
          io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
        }
      }
    });

    // Unlike event post comment
    socket.on(enums.socketEventEnum.UNLIKE_EVENT_POST_COMMENT, async (data) => {
      const { eventPostId, commentId, userId } = data;
      const eventPost = await AdminEventPost.findById(eventPostId);
      if (eventPost) {
        const comment = eventPost.userComments.id(commentId);
        if (comment) {
          comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
          await eventPost.save();
          const transformedComments = await helper.transformComments(eventPost.userComments, userId);
          io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
        }
      }
    });

    // Like event post comment reply
    socket.on(enums.socketEventEnum.LIKE_EVENT_POST_COMMENT_REPLY, async (data) => {
      const { eventPostId, commentId, replyId, userId } = data;
      const eventPost = await AdminEventPost.findById(eventPostId);
      if (eventPost) {
        const comment = eventPost.userComments.id(commentId);
        if (comment) {
          comment.replies.id(replyId).likes.push(userId);
          await eventPost.save();
          const transformedComments = await helper.transformComments(eventPost.userComments, userId);
          io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
        }
      }
    });

    // Unlike event post comment reply
    socket.on(enums.socketEventEnum.UNLIKE_EVENT_POST_COMMENT_REPLY, async (data) => {
      const { eventPostId, commentId, replyId, userId } = data;
      const eventPost = await AdminEventPost.findById(eventPostId);
      if (eventPost) {
        const comment = eventPost.userComments.id(commentId);
        if (comment) {
          const isLiked = comment.replies.id(replyId).likes.includes(userId);
          if (isLiked){
            comment.replies.id(replyId).likes = comment.replies.id(replyId).likes.filter((like) => like !== userId);
            await eventPost.save();
            const transformedComments = await helper.transformComments(eventPost.userComments, userId);
            io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
          }
        }
      }
    });

    // Delete event post comment
    socket.on(enums.socketEventEnum.DELETE_EVENT_POST_COMMENT, async (data) => {
      const { eventPostId, commentId, userId } = data;
      const eventPost = await AdminEventPost.findById(eventPostId);
      const comment = eventPost.userComments.id(commentId);

      if (comment && comment.userId.toString() === userId.toString()) {
        eventPost.userComments.pull(commentId);
        eventPost.commentCounts--;
        await eventPost.save();
        const transformedComments = await helper.transformComments(eventPost.userComments, userId);
        io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
      }
    });

    // Delete event post comment reply
    socket.on(enums.socketEventEnum.DELETE_EVENT_POST_COMMENT_REPLY, async (data) => {
      const { eventPostId, commentId, replyId, userId } = data;
      const eventPost = await AdminEventPost.findById(eventPostId);
      const comment = eventPost.userComments.id(commentId);
      const reply = comment.replies.id(replyId);
      if(comment && (reply || reply.userId?.toString() === userId?.toString()) ){
        comment.replies.pull(replyId);
        await eventPost.save();
        const transformedComments = await helper.transformComments(eventPost.userComments, userId);
        io.emit(enums.socketEventEnum.RECEIVE_EVENT_POST_COMMENT, { totalCommentCounts: helper.formatNumber(transformedComments?.length) || "0", comments: transformedComments });
      }
    });

    socket.on(enums.socketEventEnum.START_TYPING, async(data) => {
      const { toUserId } = data;
      const fromUserId = socket.user._id;

      const sender = await User.findById(fromUserId, 'name username profilePicture');
      // Emit typing event to the recipient
      io.to(toUserId.toString()).emit(enums.socketEventEnum.TYPING, {
        name: sender.name || '',
        username: sender.username || '',
        profilePicture: sender.profilePicture || '',
        userId: fromUserId || '',
        receiverId: toUserId || '',
        typing: true,
      });
    });

    socket.on(enums.socketEventEnum.STOP_TYPING, async(data) => {
      const { toUserId } = data;
      const fromUserId = socket.user._id;

      // Find the sender's details
      const sender = await User.findById(fromUserId, 'name username profilePicture');
    
      // Emit stop typing event to the recipient
      io.to(toUserId.toString()).emit(enums.socketEventEnum.TYPING, {
        name: sender.name || '',
        username: sender.username || '',
        profilePicture: sender.profilePicture || '',
        userId: fromUserId || '',
        receiverId: toUserId || '',
        typing: false,
      });
    });

    // Send message request
    socket.on(enums.socketEventEnum.SEND_MESSAGE, async (data) => {
      const { toUserId, message } = data;
      const fromUserId = socket.user._id;
      
      // Find both sender and recipient
      const sender = await User.findById(fromUserId); 
      const recipient = await User.findById(toUserId);

      if (!sender || !recipient) {
        return socket.emit(enums.socketEventEnum.ERROR, 'User not found');
      }

      const newMessage = {
        senderId: fromUserId,
        receiverId: toUserId,
        message,
        createdAt: new Date(),
        read: false,
      };

      // Check if a chat already exists between the users
      const existingChat = await Chat.findOne({
        $or: [
          { fromUserId: fromUserId, toUserId: toUserId },
          { fromUserId: toUserId, toUserId: fromUserId }
        ]
      });

      if (!existingChat) {
        console.log("11111111111111111111")
        const newChat = new Chat({
          fromUserId,
          toUserId,
          messages: [newMessage],
          requestTab: 'request',
          requestStatus: 'pending'
        });

        await newChat.save();

        io.to(toUserId.toString()).emit(enums.socketEventEnum.REQUEST_RECEIVED, {
          _id: newChat._id,
          fromUser: {
            fromUserId: sender._id,
            name: sender.name,
            username: sender.username,
            profilePicture: sender.profilePicture,
          },
          toUser: {
            toUserId: recipient._id,
            name: recipient.name,
            username: recipient.username,
            profilePicture: recipient.profilePicture,
          },
          messages: [{
            sender: {
              senderId: fromUserId,
              name: sender.name,
              username: sender.username,
              profilePicture: sender.profilePicture,
            },
            receiver: {
              receiverId: toUserId,
              name: recipient.name,
              username: recipient.username,
              profilePicture: recipient.profilePicture,
            },
            message,
            createdAt: new Date(),
          }],
          requestTab: 'request',
          requestStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        

        // Send the latest message to the receiver only (not entire chat)
        io.to(toUserId.toString()).emit(enums.socketEventEnum.RECEIVE_MESSAGE, {
          sender: {
            senderId: fromUserId,
            name: sender.name,
            username: sender.username,
            profilePicture: sender.profilePicture
          },
          receiver: {
            receiverId: toUserId,
            name: recipient.name,
            username: recipient.username,
            profilePicture: recipient.profilePicture
          },
          message: message,
          createdAt: new Date()
        });

        return;
      }

      // If chat exists and request has been accepted, continue as ongoing chat
      if (existingChat.requestStatus === 'accepted') {
        existingChat.messages.push({
          senderId: fromUserId,
          receiverId: toUserId,
          message,
          createdAt: new Date(),
          read: false
        });
        await existingChat.save();

        // Fetch and return the updated chat with user details
        const updatedChat = await Chat.findById(existingChat._id);

        const senderDetails = await User.findById(updatedChat.messages[updatedChat.messages.length - 1].senderId, 'name username profilePicture');
        const receiverDetails = await User.findById(updatedChat.messages[updatedChat.messages.length - 1].receiverId, 'name username profilePicture');

        // Send the latest message to the receiver only
        io.to(toUserId.toString()).emit(enums.socketEventEnum.RECEIVE_MESSAGE, {
          sender: {
            senderId: senderDetails._id,
            name: senderDetails.name,
            username: senderDetails.username,
            profilePicture: senderDetails.profilePicture
          },
          receiver: {
            receiverId: receiverDetails._id,
            name: receiverDetails.name,
            username: receiverDetails.username,
            profilePicture: receiverDetails.profilePicture
          },
          message: message,
          createdAt: new Date()
        });

      } else {
        existingChat.messages.push({
          senderId: fromUserId,
          receiverId: toUserId,
          message,
          createdAt: new Date(),
          read: false,
        });
        await existingChat.save();

        // Emit the pending message to the receiver only
        io.to(toUserId.toString()).emit(enums.socketEventEnum.RECEIVE_MESSAGE, {
          sender: {
            senderId: fromUserId,
            name: sender.name,
            username: sender.username,
            profilePicture: sender.profilePicture
          },
          receiver: {
            receiverId: toUserId,
            name: recipient.name,
            username: recipient.username,
            profilePicture: recipient.profilePicture
          },
          message,
          createdAt: new Date()
        });

        socket.emit(enums.socketEventEnum.CHAT_NOT_FOUND, 'Message sent. Waiting for acceptance from User B.');
      }
    });
    
    // Accept and reject chat request
    socket.on(enums.socketEventEnum.HANDLE_REQUEST, async (data) => {
      const { userId, requestId, status } = data;

      const chatRequest = await Chat.findById(requestId);
      if (!chatRequest) {
        return socket.emit(enums.socketEventEnum.ERROR, 'Request not found');
      }

      // Check if the user is authorized to accept or reject the request
      if (chatRequest.fromUserId.toString() !== userId && chatRequest.toUserId.toString() !== userId) {
        return socket.emit(enums.socketEventEnum.ERROR, 'User not authorized to accept/reject this request');
      }

      // If the request is accepted
      if (status === 'accept') {
        chatRequest.requestStatus = 'accepted';
        chatRequest.requestTab = 'chat';
        await chatRequest.save();

        // Fetch details for toUserId (the recipient)
        const toUser = await User.findById(chatRequest.toUserId);
        if (!toUser) {
          return socket.emit(enums.socketEventEnum.ERROR, 'Receiver not found');
        }

        // Emit the REQUEST_ACCEPTED event with the additional toUser data
        io.emit(enums.socketEventEnum.REQUEST_ACCEPTED, {
          fromUserId: chatRequest.fromUserId,
          toUserId: chatRequest.toUserId,
          message: chatRequest.messages[0].message,
          toUserName: toUser.name,
          toUserUsername: toUser.username,
          toUserProfilePicture: toUser.profilePicture
        });

      } else if (status === 'reject') {
        await Chat.deleteOne({ _id: requestId });

        // Emit rejection events
        io.emit(enums.socketEventEnum.REQUEST_REJECTED, { userId, requestId });
        socket.emit(enums.socketEventEnum.REQUEST_REJECTED, { status: 'rejected' });
      } else {
        // If status is not valid, send an error
        socket.emit(enums.socketEventEnum.ERROR, 'Invalid status. Status must be "accept" or "reject"');
      }
    });

    // Fetch all chats for a user
    socket.on(enums.socketEventEnum.FETCH_USER_CHATS, async (data) => {
      const { requestTab } = data;  // The filter for 'request' or 'chat'
      const userId = socket.user._id;
      try {
        // Find chats where the user is either the sender or the receiver
        const userChats = await Chat.find({
          $or: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        })
        .populate('fromUserId', 'name username profilePicture')
        .populate('toUserId', 'name username profilePicture');
    
        // Transform data to match desired structure
        const formattedChats = await Promise.all(userChats.map(async (chat) => {
          // Fetch the first message from the chat (if exists)
          const firstMessage = chat.messages[0];
    
          // Check if the first message's senderId matches the requesting user's ID
          const isSenderFirstMessage = firstMessage.senderId.toString() === userId.toString();
    
          if (isSenderFirstMessage && requestTab === "request" && userId.toString() === chat.fromUserId._id.toString()) {
            return null;
          }

          if (!isSenderFirstMessage && userId.toString() === chat.toUserId._id.toString() && ((chat.requestStatus === "accepted" && requestTab === "request") || (chat.requestStatus === "pending" && requestTab === "chat"))) {
            return null;
          }

          const unreadCount = chat.messages.filter(msg => msg.read === false && msg.receiverId.toString() === userId.toString()).length;
          
          // Manually populate sender and receiver details for each message
          const messagesWithUserDetails = chat.messages.map(msg => ({
            sender: {
              senderId: msg.senderId,
              name: chat.fromUserId.name,
              username: chat.fromUserId.username,
              profilePicture: chat.fromUserId.profilePicture
            },
            receiver: {
              receiverId: msg.receiverId,
              name: chat.toUserId.name,
              username: chat.toUserId.username,
              profilePicture: chat.toUserId.profilePicture
            },
            message: msg.message,
            createdAt: msg.createdAt,
            read: msg.read,
          }));
    
          // Determine the requestTab for the chat
          const filteredRequestTab = (chat.requestTab === "request" && isSenderFirstMessage) ? "chat" : chat.requestTab;
    
          // Return the formatted chat data with adjusted requestTab
          return {
            _id: chat._id,
            fromUser: userId.toString() !== chat.fromUserId._id.toString() ? {
              fromUserId: chat.fromUserId._id,
              name: chat.fromUserId.name,
              username: chat.fromUserId.username,
              profilePicture: chat.fromUserId.profilePicture
            } : {
              fromUserId: chat.toUserId._id,
              name: chat.toUserId.name,
              username: chat.toUserId.username,
              profilePicture: chat.toUserId.profilePicture
            },
            toUser: userId.toString() !== chat.toUserId._id.toString() ? {
              toUserId: chat.toUserId._id,
              name: chat.toUserId.name,
              username: chat.toUserId.username,
              profilePicture: chat.toUserId.profilePicture
            } : {
              toUserId: chat.fromUserId._id,
              name: chat.fromUserId.name,
              username: chat.fromUserId.username,
              profilePicture: chat.fromUserId.profilePicture
            },
            messages: messagesWithUserDetails,  
            requestTab: filteredRequestTab,
            requestStatus: chat.requestStatus,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            unreadCount: unreadCount,
          };
        }));
    
        // Filter out any null chats (those that should not be returned)
        const filteredChats = formattedChats.filter(chat => chat !== null);
    
        // Return the formatted chats to the client
        socket.emit(enums.socketEventEnum.USER_CHATS, filteredChats);
      } catch (error) {
        console.error('Error fetching user chats:', error);
        socket.emit(enums.socketEventEnum.ERROR, 'Error fetching chats');
      }
    });
    
    // Fetch single chat between two users
    socket.on(enums.socketEventEnum.FETCH_SINGLE_CHAT, async (data) => {
      const { fromUserId, toUserId } = data;
      try {
        // Find the chat between the two users
        const existingChat = await Chat.findOne({
          $or: [
            { fromUserId: fromUserId, toUserId: toUserId },
            { fromUserId: toUserId, toUserId: fromUserId }
          ]
        })
        .populate('fromUserId', 'name username profilePicture')
        .populate('toUserId', 'name username profilePicture');

        if (!existingChat) {
          return socket.emit(enums.socketEventEnum.ERROR, 'Chat not found');
        }

        // Mark all unread messages as read
        await Chat.updateMany(
          { _id: existingChat._id, 'messages.read': false },
          { $set: { 'messages.$[].read': true } }
        );

        // Manually populate sender and receiver details for each message
        const messagesWithUserDetails = await Promise.all(existingChat.messages.map(async (msg) => {
          const senderDetails = await User.findById(msg.senderId, 'name username profilePicture');
          const receiverDetails = await User.findById(msg.receiverId, 'name username profilePicture');

          return {
            sender: {
              senderId: msg.senderId,
              name: senderDetails.name,
              username: senderDetails.username,
              profilePicture: senderDetails.profilePicture
            },
            receiver: {
              receiverId: msg.receiverId,
              name: receiverDetails.name,
              username: receiverDetails.username,
              profilePicture: receiverDetails.profilePicture
            },
            message: msg.message,
            createdAt: msg.createdAt,
            read: msg.read
          };
        }));

        // Emit the fetched chat to the requesting user
        socket.emit(enums.socketEventEnum.RECEIVE_SINGLE_CHAT, {
          chatId: existingChat._id,
          messages: messagesWithUserDetails,
          requestTab: existingChat.requestTab,
          requestStatus: existingChat.requestStatus,
          createdAt: existingChat.createdAt,
          updatedAt: existingChat.updatedAt
        });

      } catch (error) {
        console.error('Error fetching single chat:', error);
        socket.emit(enums.socketEventEnum.ERROR, 'Error fetching chat');
      }
    });

    // Get total unread messages and unread chats for a user
    socket.on(enums.socketEventEnum.GET_UNREAD_STATS, async () => {
      const userId = socket.user._id;

      // Guard against invalid or missing user IDs to prevent ObjectId cast errors
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.error('Error fetching unread stats: invalid userId', userId);
        socket.emit(enums.socketEventEnum.ERROR, 'Error fetching unread stats');
        return;
      }

      try {
        // Find all chats where the user is either the sender or the receiver
        const userChats = await Chat.find({
          $or: [
            { fromUserId: userId },
            { toUserId: userId }
          ]
        }).populate('fromUserId', 'name username profilePicture').populate('toUserId', 'name username profilePicture');

        // Initialize counters
        let totalUnreadMessages = 0;
        let totalUnreadChats = 0;

        // Iterate through each chat and calculate the unread messages
        userChats.forEach(chat => {
          // Count unread messages for this chat
          const unreadMessagesInChat = chat.messages.filter(msg => msg.read === false && msg.receiverId.toString() === userId.toString()).length;
          
          // If there are unread messages in this chat, increment the unread chat count
          if (unreadMessagesInChat > 0) {
            totalUnreadChats++;
          }

          // Add the unread messages in this chat to the total unread messages
          totalUnreadMessages += unreadMessagesInChat;
        });

        // Return the stats to the client
        socket.emit(enums.socketEventEnum.UNREAD_STATS, {
          totalUnreadMessages,
          totalUnreadChats
        });
      } catch (error) {
        console.error('Error fetching unread stats:', error);
        socket.emit(enums.socketEventEnum.ERROR, 'Error fetching unread stats');
      }
    });

  });

  return io;
};
