import express from 'express';
import { protectUser } from '../middleware/authMiddleware.js';
import { createManualCard, deleteCard } from '../controllers/cardController.js';

const router = express.Router();

router.route('/').post(protectUser, createManualCard);
router.route('/:id').delete(protectUser, deleteCard);

export default router;
