import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, recipientId, content, attachments } = req.body;
    const senderId = req.user._id;

    let conversation;

    if (conversationId) {
      // Verify conversation exists and user is a participant
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: senderId
      });

      if (!conversation) {
        return res.status(404).json({
          status: 'error',
          message: 'Conversation not found or you\'re not a participant'
        });
      }
    } else if (recipientId) {
      // Check if a conversation already exists between these users
      conversation = await Conversation.findOne({
        type: 'private',
        participants: { $all: [senderId, recipientId], $size: 2 }
      });

      if (!conversation) {
        // Create new conversation if it doesn't exist
        conversation = new Conversation({
          participants: [senderId, recipientId],
          type: 'private',
          unreadCounts: [
            { user: senderId, count: 0 },
            { user: recipientId, count: 0 }
          ]
        });
        await conversation.save();
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Either conversationId or recipientId is required'
      });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      conversation: conversationId,
      content,
      attachments,
      readBy: [senderId]
    });

    await message.save();

    // Update conversation's last message and activity
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();

    // Increment unread count for other participants
    conversation.unreadCounts = conversation.unreadCounts.map(count => {
      if (count.user.toString() !== senderId.toString()) {
        return { ...count, count: count.count + 1 };
      }
      return count;
    });

    await conversation.save();

    // Populate sender details
    await message.populate('sender', 'firstName lastName username avatar');

    res.status(201).json({
      status: 'success',
      data: { message }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found or you\'re not a participant'
      });
    }

    // Get messages with pagination
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'firstName lastName username avatar');

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    // Reset unread count for user
    const unreadCountIndex = conversation.unreadCounts.findIndex(
      count => count.user.toString() === userId.toString()
    );
    if (unreadCountIndex !== -1) {
      conversation.unreadCounts[unreadCountIndex].count = 0;
      await conversation.save();
    }

    res.json({
      status: 'success',
      data: { messages }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId
    });

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found or you\'re not the sender'
      });
    }

    message.isDeleted = true;
    await message.save();

    res.json({
      status: 'success',
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};