import express from 'express';
const router = express.Router();

// Routes will be defined here
router.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

export default router;