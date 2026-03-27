import express from 'express';
import { requireAuth } from '@clerk/express';
import { createGroup, createLinkDocument, deleteGroup, listGroups } from '../controllers/group.controller.js';

const router = express.Router();

router.get('/', requireAuth(), listGroups);
router.post('/', requireAuth(), createGroup);
router.post('/documents/links', requireAuth(), createLinkDocument);
router.delete('/:groupId', requireAuth(), deleteGroup);

export default router;
