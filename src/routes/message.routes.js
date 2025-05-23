import express from 'express';
import {
  sendMessage,
  getMessages,
  deleteMessage
} from '../controllers/message.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(verifyToken);

// Message routes
router.post('/', sendMessage);
router.get('/:conversationId', getMessages);
router.delete('/:messageId', deleteMessage);

export default router;