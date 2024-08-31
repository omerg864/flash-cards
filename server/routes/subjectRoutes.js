import express from 'express';
import { protectUser } from '../middleware/authMiddleware.js';
import { createSubject, deleteSubject, getSubjects, updateSubject, getSubject } from '../controllers/subjectController.js';

const router = express.Router();

router.route('/').post(protectUser, createSubject);
router.route('/').get(protectUser, getSubjects);
router.route('/:id').delete(protectUser, deleteSubject);
router.route('/:id').put(protectUser, updateSubject);
router.route('/:id').get(protectUser, getSubject);


export default router;
