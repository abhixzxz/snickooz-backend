import User from '../models/user.model.js';
import { generateToken } from '../middleware/auth.middleware.js';

// Generate unique username from first and last name
const generateUniqueUsername = async (firstName, lastName) => {
  const baseUsername = `${firstName.toLowerCase()}${lastName.toLowerCase()}`;
  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
};

// Register new user
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, gender, dateOfBirth } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }

    // Generate unique username
    const username = await generateUniqueUsername(firstName, lastName);

    // Generate avatar URL based on gender
    const avatarUrl = gender === 'female'
      ? `https://avatar.iran.liara.run/public/girl?username=${username}`
      : `https://avatar.iran.liara.run/public/boy?username=${username}`;

    // Create new user
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      gender,
      dateOfBirth,
      avatar: avatarUrl
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    const userProfile = user.toPublicProfile();
    res.status(201).json({
      status: 'success',
      data: {
        ...userProfile,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    user.status = 'active';
    user.lastActive = new Date();
    await user.save();


    const token = generateToken(user._id);

    res.json({
      status: 'success',
      data: {
        user: user.toPublicProfile(),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      status: 'success',
      data: {
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName',
      'lastName',
      'username',
      'gender',
      'dateOfBirth',
      'location',
      'bio',
      'company',
      'socialLinks',
      'status',
      'statusMessage'
    ];

    const updates = Object.entries(req.body)
      .filter(([key]) => allowedUpdates.includes(key))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: req.user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Username already exists'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      data: {
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user status
export const updateStatus = async (req, res) => {
  try {
    const { status, statusMessage } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          status,
          statusMessage,
          lastActive: new Date()
        }
      },
      { new: true }
    );

    res.json({
      status: 'success',
      data: {
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        user: user.toPublicProfile()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};