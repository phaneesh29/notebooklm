import express from 'express';
import { clerkWebhookHandler } from '../controllers/webhook.controller.js';

const router = express.Router();
router.post('/clerk', express.raw({ type: 'application/json' }), clerkWebhookHandler);

export default router;
