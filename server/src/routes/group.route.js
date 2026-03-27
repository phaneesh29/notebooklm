import express from 'express';
import { requireAuth } from '@clerk/express';
import { createGroup, deleteGroup } from '../controllers/group.controller.js';

const router = express.Router();

router.post('/', requireAuth(), createGroup);
router.delete('/:groupId', requireAuth(), deleteGroup);

export default router;
