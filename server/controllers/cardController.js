import asyncHandler from 'express-async-handler';
import Card from '../models/cardModel.js';

const createManualCard = asyncHandler(async (req, res, next) => {
	const { front, back, subject } = req.body;
	if (!front || !back || !subject) {
		res.status(400);
		throw new Error('Please fill all the fields');
	}
	const card = await createCard(front, back, subject, req.user._id);
	res.status(201).json({
		success: true,
		card,
	});
});

const createCard = (front, back, subject, user) => {
	const card = new Card({
		front,
		back,
		subject,
		user,
	});
	return card.save();
};

const deleteCard = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const card = await Card.findById(id);
	if (!card) {
		res.status(404);
		throw new Error('Card not found');
	}
	if (card.user.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error('Unauthorized');
	}
	await Card.findByIdAndDelete(id);
	res.status(200).json({
		success: true,
	});
});

export { createManualCard, deleteCard, createCard };
