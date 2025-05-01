import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword,
  updateStatus,
  getUserById
} from '../controllers/user.controller.js';
import { verifyToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);

// Protected routes - require authentication
router.use(verifyToken);

// Profile routes
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.patch('/password', updatePassword);
router.patch('/status', updateStatus);

router.get('/users/:id', optionalAuth, getUserById);

export default router;