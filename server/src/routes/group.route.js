import express from 'express';
import { requireAuth } from '@clerk/express';
import { createGroup } from '../controllers/group.controller.js';

const router = express.Router();

router.post('/', requireAuth(), createGroup);

export default router;
