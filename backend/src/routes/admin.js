import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticate, requireAdmin, (req, res) => {
  res.json({
    message: 'Welcome to Cinema Box Admin Dashboard.',
    user: req.user
  });
});

export default router;
