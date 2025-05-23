import express from 'express';
import userRoutes from './user.routes.js';
import connectionRoutes from './connection.routes.js';
import messageRoutes from './message.routes.js';
import conversationRoutes from './conversation.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API is running => SUCCESSFULLY..!!' });
});

router.use('/users', userRoutes);
router.use('/connections', connectionRoutes);
router.use('/messages', messageRoutes);
router.use('/conversations', conversationRoutes);

export default router;