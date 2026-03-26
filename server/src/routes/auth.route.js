import express from 'express';
import { requireAuth } from '@clerk/express';
import { getMe, updateApiKey } from '../controllers/auth.controller.js';

const router = express.Router();

router.get('/users/me', requireAuth(), getMe);
router.post('/users/api-key', requireAuth(), updateApiKey);

export default router;
