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
router.post('/documents/links', requireAuth(), createLinkDocument);
router.post('/documents/files', requireAuth(), upload.single('file'), createFileDocument);
router.delete('/:groupId', requireAuth(), deleteGroup);

export default router;
