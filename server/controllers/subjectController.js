import asyncHandler from 'express-async-handler';
import Subject from '../models/subjectModel.js';

const createSubject = asyncHandler(async (req, res, next) => {
	const { name } = req.body;
	if (!name) {
		res.status(400);
		throw new Error('Please fill all the fields');
	}
	const subject = new Subject({
		name,
		user: req.user._id,
	});
	await subject.save();
	res.status(201).json({
		success: true,
		subject,
	});
});

const getSubjects = asyncHandler(async (req, res, next) => {
	const subjects = await Subject.find({ user: req.user._id });
	res.status(200).json({
		success: true,
		subjects,
	});
});

const deleteSubject = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const subject = await Subject.findById(id);
	if (!subject) {
		res.status(404);
		throw new Error('Subject not found');
	}
	await Subject.findByIdAndDelete(id);
	res.status(200).json({
		success: true,
	});
});

const getSubject = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const subject = await Subject.findById(id).populate('cards');
	if (!subject) {
		res.status(404);
		throw new Error('Subject not found');
	}
	if (subject.user.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error('Unauthorized');
	}
	res.status(200).json({
		success: true,
		subject,
	});
});

const updateSubject = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const { name } = req.body;
	if (!name) {
		res.status(400);
		throw new Error('Please fill all the fields');
	}
	const subject = await Subject.findById(id);
	if (!subject) {
		res.status(404);
		throw new Error('Subject not found');
	}
	if (subject.user.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error('Unauthorized');
	}
	subject.name = name;
	await subject.save();
	res.status(200).json({
		success: true,
		subject,
	});
});

export { createSubject, getSubjects, deleteSubject, getSubject, updateSubject };
