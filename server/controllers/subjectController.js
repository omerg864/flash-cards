import asyncHandler from 'express-async-handler';
import Subject from '../models/subjectModel.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { createCard } from './cardController.js';
import { SchemaType } from '@google/generative-ai';
import { createFile } from './fileController.js';
import fs from 'fs';
import path from 'path';
import { deleteFile as deleteFileObject } from './fileController.js';

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
	const subject = await Subject.findById(id).populate('cards files');
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
	if (!req.file) {
		res.status(400);
		throw new Error('Please upload a file');
	}
	if (!req.user.premium) {
		if (subject.files.length >= 5) {
			res.status(400);
			throw new Error(
				'You have reached the maximum number of files allowed for free users'
			);
		}
	}
	const tempFilePath = path.join('/tmp', `tempfile-${Date.now()}.pdf`);

	// Write the buffer (in this case, from req.file.buffer)
	fs.writeFileSync(tempFilePath, req.file.buffer);

	const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
	const result = await fileManager.uploadFile(tempFilePath, {
		mimeType: req.file.mimetype,
		displayName: `cards-${subject.name}-${new Date().toISOString()}-${
			req.user._id
		}`,
	});
	fs.unlinkSync(tempFilePath);
	console.log(result);
	const fileObj = await createFile(
		result.file.name,
		result.file.uri,
		result.file.mimeType
	);
	subject.files = subject.files.concat(fileObj._id);
	await subject.save();
	res.status(200).json({
		success: true,
	});
});

const deleteFile = asyncHandler(async (req, res, next) => {
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
	const file = await getFile(id);
	if (!file) {
		res.status(404);
		throw new Error('File not found');
	}
	const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
	const promises = [];
	promises.push(fileManager.deleteFile(file.name));
	promises.push(deleteFileObject(file._id));
	subject.files = subject.files.filter((file) => file._id.toString() !== id);
	promises.push(subject.save());
	await Promise.all(promises);
	res.status(200).json({
		success: true,
	});
});

const generateCards = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const { language } = req.body;
	const subject = await Subject.findById(id).populate('files');
	if (!subject) {
		res.status(404);
		throw new Error('Subject not found');
	}
	if (subject.user.toString() !== req.user._id.toString()) {
		res.status(401);
		throw new Error('Unauthorized');
	}
	if (!req.user.premium) {
		if (req.user.generations <= 0) {
			res.status(400);
			throw new Error('You have no more generations left');
		}
		req.user.generations -= 1;
		await req.user.save();
	}
	const prompt = `create me 10 flash cards for ${subject.name} in ${
		language ? language : 'English'
	} in JSON format (front and back)`;
	const promptWithFile = `create me 10 flash cards from these files in ${
		language ? language : 'English'
	} in JSON format (front and back)`;
	const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
	const model = genAI.getGenerativeModel({
		model: 'gemini-1.5-flash',
		generationConfig: {
			responseMimeType: 'application/json',
			responseSchema: {
				type: SchemaType.ARRAY,
				items: {
					type: SchemaType.OBJECT,
					properties: {
						front: {
							type: SchemaType.STRING,
						},
						back: {
							type: SchemaType.STRING,
						},
					},
				},
			},
		},
	});
	let result;
	if (!subject.files.length) {
		result = await model.generateContent(prompt);
	} else {
		result = await model.generateContent([
			promptWithFile,
			...subject.files.map((file) => ({
				fileData: {
					mimeType: file.type,
					fileUri: file.uri,
				},
			})),
		]);
	}
	console.log(result.response.text());
	const resultJSON = JSON.parse(result.response.text());
	const cards = await Promise.all(
		resultJSON.map((card) =>
			createCard(card.front, card.back, id, req.user._id)
		)
	);
	subject.cards = subject.cards.concat(cards.map((card) => card._id));
	await subject.save();
	res.status(200).json({
		success: true,
		result: resultJSON,
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
	deleteFile
};
