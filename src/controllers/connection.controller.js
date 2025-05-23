import Connection from '../models/connection.model.js';
import User from '../models/user.model.js';

// Get all connections for a user
export const getUserConnections = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id;
    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'connected'
    })
    .populate('requester', 'firstName lastName username avatar status')
    .populate('recipient', 'firstName lastName username avatar status')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    const formattedConnections = connections.map(conn => {
      try {
        if (!conn.requester || !conn.recipient || !conn.requester._id || !conn.recipient._id) {
          console.error('Invalid connection data:', conn);
          return null;
        }

        const otherUser = conn.requester._id.toString() === userId.toString() ? conn.recipient : conn.requester;
        
        if (!otherUser || !otherUser._id) {
          console.error('Invalid other user data:', otherUser);
          return null;
        }

        return {
          connectionId: conn._id,
          user: {
            _id: otherUser._id,
            firstName: otherUser.firstName || '',
            lastName: otherUser.lastName || '',
            username: otherUser.username || '',
            avatar: otherUser.avatar || '',
            status: otherUser.status || 'offline'
          },
          lastMessage: conn.lastMessage || null,
          lastMessageTime: conn.lastMessageTime || null,
          unreadCount: conn.unreadCount || 0
        };
      } catch (err) {
        console.error('Error formatting connection:', err);
        return null;
      }
    });

    const validConnections = formattedConnections.filter(conn => conn !== null);
    res.status(200).json({ connections: validConnections });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching connections', error: error.message });
  }
};

// Create a new connection request
export const createConnection = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({
        message: 'Connection already exists',
        status: existingConnection.status
      });
    }

    const newConnection = await Connection.create({
      requester: requesterId,
      recipient: recipientId
    });

    const populatedConnection = await Connection.findById(newConnection._id)
      .populate('requester', 'firstName lastName username avatar status')
      .populate('recipient', 'firstName lastName username avatar status');

    res.status(201).json({
      message: 'Connection request sent',
      connection: populatedConnection
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating connection', error: error.message });
  }
};

// Update connection status (only for blocking)
export const updateConnectionStatus = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (status !== 'blocked') {
      return res.status(400).json({ message: 'Invalid status. Only blocking is allowed.' });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      $or: [{ requester: userId }, { recipient: userId }]
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    connection.status = status;
    await connection.save();

    const updatedConnection = await Connection.findById(connectionId)
      .populate('requester', 'firstName lastName username avatar status')
      .populate('recipient', 'firstName lastName username avatar status');

    res.status(200).json({
      message: 'User blocked successfully',
      connection: updatedConnection
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating connection', error: error.message });
  }
};

// Get random users for connection suggestions
export const getRandomUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gender, ageGroup } = req.query;

    // Get IDs of users already connected or pending
    const connections = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }]
    });
    const connectedUserIds = connections.map(conn => 
      conn.requester.toString() === userId.toString() ? conn.recipient : conn.requester
    );
    connectedUserIds.push(userId); // Add current user to excluded list

    // Build query based on filters
    const query = {
      _id: { $nin: connectedUserIds }
    };
    if (gender) query.gender = gender.toLowerCase();
    if (ageGroup) {
      const [minAge, maxAge] = ageGroup.split('-').map(Number);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
      query.dateOfBirth = { $gte: minDate, $lte: maxDate };
    }

    const randomUsers = await User.aggregate([
      { $match: query },
      { $sample: { size: 8 } },
      { $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        username: 1,
        avatar: 1,
        status: 1,
        gender: 1
      }}
    ]);

    res.status(200).json({ users: randomUsers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching random users', error: error.message });
  }
};