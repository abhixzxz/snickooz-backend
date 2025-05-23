import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';

// Create a new conversation
export const createConversation = async (req, res) => {
  try {
    const { participants, type, name } = req.body;
    const userId = req.user._id;

    // Ensure creator is included in participants
    if (!participants.includes(userId.toString())) {
      participants.push(userId);
    }

    // Create conversation
    const conversation = new Conversation({
      participants,
      type,
      name,
      admins: type === 'group' ? [userId] : [],
      unreadCounts: participants.map(participant => ({
        user: participant,
        count: 0
      }))
    });

    await conversation.save();

    // Populate participant details
    await conversation.populate('participants', 'firstName lastName username avatar status');
    await conversation.populate('lastMessage');

    res.status(201).json({
      status: 'success',
      data: { conversation }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get user's conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .sort({ lastActivity: -1 })
      .populate('participants', 'firstName lastName username avatar status')
      .populate('lastMessage');

    res.json({
      status: 'success',
      data: { conversations }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get conversation by ID
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    })
      .populate('participants', 'firstName lastName username avatar status')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found or you\'re not a participant'
      });
    }

    res.json({
      status: 'success',
      data: { conversation }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update group conversation
export const updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      admins: userId
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found or you\'re not an admin'
      });
    }

    conversation.name = name;
    await conversation.save();

    res.json({
      status: 'success',
      data: { conversation }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add participants to group conversation
export const addParticipants = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { participants } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      admins: userId
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found or you\'re not an admin'
      });
    }

    // Add new participants
    conversation.participants.push(...participants);
    
    // Add unread counts for new participants
    conversation.unreadCounts.push(
      ...participants.map(participant => ({
        user: participant,
        count: 0
      }))
    );

    await conversation.save();

    res.json({
      status: 'success',
      data: { conversation }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Remove participant from group conversation
export const removeParticipant = async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      admins: userId
    });

    if (!conversation) {
      return res.status(404).json({
        status: 'error',
        message: 'Conversation not found or you\'re not an admin'
      });
    }

    // Remove participant
    conversation.participants = conversation.participants.filter(
      p => p.toString() !== participantId
    );

    // Remove unread count
    conversation.unreadCounts = conversation.unreadCounts.filter(
      count => count.user.toString() !== participantId
    );

    await conversation.save();

    res.json({
      status: 'success',
      data: { conversation }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};