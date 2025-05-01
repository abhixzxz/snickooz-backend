import express from 'express';
import userRoutes from './user.routes.js';

const router = express.Router();


router.get('/', (req, res) => {
  res.json({ message: 'API is running => SUCCESSFULLY..!!' });
});

router.use('/users', userRoutes);

export default router;