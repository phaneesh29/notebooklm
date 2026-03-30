import express from 'express';
import multer from 'multer';
import { requireAuth } from '@clerk/express';
import {
  createFileDocument,
  createGroup,
  createLinkDocument,
  deleteGroup,
  listGroupDocuments,
  listGroups,
} from '../controllers/group.controller.js';
import { getGroupChats, streamGroupChat } from '../controllers/chat.controller.js';
import { requireApiKey } from '../middlewares/auth.middleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

router.get('/', requireAuth(), listGroups);
router.post('/', requireAuth(), createGroup);
router.get('/:groupId/documents', requireAuth(), listGroupDocuments);
router.get('/:groupId/chat', requireAuth(), getGroupChats);
router.post('/:groupId/chat/stream', requireAuth(), requireApiKey, streamGroupChat);
router.post('/documents/links', requireAuth(), createLinkDocument);
router.post('/documents/files', requireAuth(), upload.single('file'), createFileDocument);
router.delete('/:groupId', requireAuth(), deleteGroup);

export default router;
