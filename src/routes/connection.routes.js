import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getUserConnections,
  createConnection,
  updateConnectionStatus,
  getRandomUsers
} from '../controllers/connection.controller.js';

const router = express.Router();

// Get all connections for the authenticated user
router.get('/', verifyToken, getUserConnections);

// Create a new connection request
router.post('/', verifyToken, createConnection);

// Update connection status (accept/reject)
router.patch('/:connectionId', verifyToken, updateConnectionStatus);

// Get random users for connection suggestions
router.get('/suggestions', verifyToken, getRandomUsers);

export default router;