import asyncHandler from 'express-async-handler';
import Subject from '../models/subjectModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { createCard } from './cardController.js';

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

const uploadFile = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const subject = await Subject.findById(id);
	if (!subject) {
		res.status(404);
		throw new Error('Subject not found');
	}
	if (subject.user.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error('Unauthorized');
	}
	const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
	const file = req.files[0];
	const result = await fileManager.uploadFile(file, {
		displayName: `cards-${subject.name}-${new Date().toISOString()}-${
			req.user._id
		}`,
	});
	subject.fileUri = result.response.uri;
	subject.fileType = result.response.type;
	await subject.save();
	res.status(200).json({
		success: true,
	});
});

const generateCards = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const { language } = req.body;
	const subject = await Subject.findById(id);
	if (!subject) {
		res.status(404);
		throw new Error('Subject not found');
	}
	if (subject.user.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error('Unauthorized');
	}
	const prompt = `create me flash cards for ${subject.name} (${language}) in json format and write to me only the json`;
	const promptWithFile = `create me flash cards from this file (${language}) in json format and write to me only the json`;
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
	const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
	let result;
	if (!subject.fileUri) {
		result = await model.generateContent(prompt);
	} else {
		result = await model.generateContent(promptWithFile, {
			fileUri: subject.fileUri,
			fileType: subject.fileType,
		});
	}
	const jsonRes = JSON.parse(
		result.response.text().replace('```json', '').replace('```', '')
	);
	console.log(jsonRes);
	const cards = await Promise.all(
		jsonRes.map((card) =>
			createCard(card.front, card.back, id, req.user._id)
		)
	);
	subject.cards = subject.cards.concat(cards.map((card) => card._id));
	await subject.save();
	res.status(200).json({
		success: true,
		result: jsonRes,
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

export {
	createSubject,
	getSubjects,
	deleteSubject,
	getSubject,
	updateSubject,
	generateCards,
	uploadFile,
};
