import express from 'express';
import { protectUser } from '../middleware/authMiddleware.js';
import {
	createSubject,
	deleteSubject,
	getSubjects,
	updateSubject,
	getSubject,
	generateCards,
	uploadFile,
	deleteFile,
} from '../controllers/subjectController.js';
import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({ storage });

const router = express.Router();

router.route('/').post(protectUser, createSubject);
router.route('/').get(protectUser, getSubjects);
router.route('/:id').delete(protectUser, deleteSubject);
router.route('/:id').put(protectUser, updateSubject);
router.route('/:id').get(protectUser, getSubject);
router.route('/:id/generate').post(protectUser, generateCards);
router
	.route('/:id/upload')
	.post(protectUser, upload.single('file'), uploadFile);
router
	.route('/:id/upload')
	.delete(protectUser, deleteFile);

export default router;
