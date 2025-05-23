import express from 'express';
import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  addParticipants,
  removeParticipant
} from '../controllers/conversation.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(verifyToken);

// Conversation routes
router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:conversationId', getConversation);
router.patch('/:conversationId', updateConversation);
router.post('/:conversationId/participants', addParticipants);
router.delete('/:conversationId/participants/:participantId', removeParticipant);

export default router;