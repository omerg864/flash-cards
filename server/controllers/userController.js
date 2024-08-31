import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import googleAuthClient from '../config/google.js';
import { email_regex, password_regex } from '../utils/regex.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import axios from 'axios';

const register = asyncHandler(async (req, res, next) => {
	const { name, email, password } = req.body;
	if ((!name, !email, !password)) {
		res.status(400);
		throw new Error('Please fill all the fields');
	}
	if (!email_regex.test(email)) {
		res.status(400);
		throw new Error('Invalid email');
	}
	if (!password_regex.test(password)) {
		res.status(400);
		throw new Error('Invalid password');
	}
	const userExists = await User.findOne({
		email: { $regex: new RegExp(email, 'i') },
	});
	if (userExists) {
		res.status(400);
		throw new Error('User with that email already exists');
	}
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	const user = await User.create({
		name,
		email: email,
		password: hashedPassword,
	});
	let success = false;
	try {
		success = await sendEmail(
			user.email,
			'Verify your email',
			`Please verify your email by clicking on the link: ${process.env.CLIENT_URL}/verify/${user._id}`
		);
	} catch (err) {
		console.log(err);
		user.isVerified = true;
		await user.save();
	}
	if (!success) {
		user.isVerified = true;
		await user.save();
	}
	res.status(201).json({
		success: true,
		email: success,
	});
});

const login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body;
	if (!email_regex.test(email)) {
		res.status(400);
		throw new Error('Invalid email');
	}
	if (!password_regex.test(password)) {
		res.status(400);
		throw new Error('Invalid password');
	}
	var user = await User.findOne({
		email: { $regex: new RegExp(`^${email}$`, 'i') },
	});
	if (!user) {
		res.status(400);
		throw new Error('Invalid email or password');
	}
	if (!user.isVerified) {
		res.status(400);
		throw new Error('Please verify your email');
	}
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		res.status(400);
		throw new Error('Invalid email or password');
	}
	const token = generateToken(user._id);
	delete user._doc['password'];
	delete user._doc['createdAt'];
	delete user._doc['updatedAt'];
	delete user._doc['__v'];
	res.status(200).json({
		success: true,
		user: {
			...user._doc,
		},
		token,
	});
});

const verify = asyncHandler(async (req, res, next) => {
	const { id } = req.params;
	const user = await User.findById(id);
	if (!user) {
		res.status(400);
		throw new Error('User not found');
	}
	user.isVerified = true;
	await user.save();
	res.status(200).json({
		success: true,
	});
});

const getUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user._id);
	if (!user) {
		res.status(400);
		throw new Error('User not found');
	}
	res.status(200).json({
		success: true,
		user: user,
	});
});

const updateUserInfo = asyncHandler(async (req, res, next) => {
	const { name, email } = req.body;
	if ((!name, !email)) {
		res.status(400);
		throw new Error('Please fill all the fields');
	}
	const user = await User.findById(req.user._id);
	if (!user) {
		res.status(400);
		throw new Error('User not found');
	}
	user.name = name;
	user.email = email;
	await user.save();
	res.status(200).json({
		success: true,
		user,
	});
});

const updateUserPassword = asyncHandler(async (req, res, next) => {
	const { password } = req.body;
	if (!password) {
		res.status(400);
		throw new Error('Please fill all the fields');
	}
	const user = await User.findById(req.user._id);
	if (!user) {
		res.status(400);
		throw new Error('User not found');
	}
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	user.password = hashedPassword;
	await user.save();
	res.status(200).json({
		success: true,
	});
});

const resetPasswordEmail = asyncHandler(async (req, res, next) => {
	const { email } = req.body;
	if (!email_regex.test(email)) {
		res.status(400);
		throw new Error('Invalid email');
	}
	const user = await User.findOne({
		email: { $regex: new RegExp(`^${email}$`, 'i') },
	});
	if (!user) {
		res.status(400);
		throw new Error('User not found');
	}
	const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
		expiresIn: '1d',
	});
	user.resetPasswordToken = token;
	await user.save();
	let success = true;
	try {
		success = await sendEmail(
			user.email,
			'Reset your password',
			`Please reset your password by clicking on the link: ${process.env.CLIENT_URL}/reset-password/${token}`
		);
	} catch (err) {
		console.log('email error: ' + err);
		user.resetPasswordToken = undefined;
		await user.save();
		success = false;
	}
	res.status(200).json({
		success,
	});
});

const resetPasswordToken = asyncHandler(async (req, res, next) => {
	const { token } = req.params;
	const { password } = req.body;
	const user = await User.findOne({
		resetPasswordToken: { $regex: new RegExp(`^${token}$`, 'i') },
	});
	if (!user) {
		res.status(400);
		throw new Error('Invalid token');
	}
	if (!password_regex.test(password)) {
		res.status(400);
		throw new Error('Invalid password');
	}
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(password, salt);
	user.password = hashedPassword;
	user.resetPasswordToken = undefined;
	await user.save();
	res.status(200).json({
		success: true,
	});
});

const googleAuth = asyncHandler(async (req, res, next) => {
	const { code } = req.body;
	if (!code) {
		res.status(400);
		throw new Error('Invalid code');
	}

	const googleRes = await googleAuthClient.getToken(code);

	googleAuthClient.setCredentials(googleRes.tokens);

	const userRes = await axios.get(
		`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`
	);
	if (!userRes.data.email) {
		res.status(400);
		throw new Error('Invalid email');
	}
	const user = await User.findOne({
		email: { $regex: new RegExp(`^${userRes.data.email}$`, 'i') },
	});
	if (!user) {
		// create user
		const newUser = await User.create({
			name: userRes.data.name,
			email: userRes.data.email,
			isVerified: true,
		});
		const token = generateToken(newUser._id);
		delete newUser._doc['password'];
		delete newUser._doc['createdAt'];
		delete newUser._doc['updatedAt'];
		delete newUser._doc['__v'];
		res.status(200).json({
			success: true,
			user: {
				...newUser._doc,
			},
			token,
		});
	} else {
		// login
		const token = generateToken(user._id);
		delete user._doc['password'];
		delete user._doc['createdAt'];
		delete user._doc['updatedAt'];
		delete user._doc['__v'];
		res.status(200).json({
			success: true,
			user: {
				...user._doc,
			},
			token,
		});
	}
});

export {
	register,
	login,
	verify,
	getUser,
	updateUserInfo,
	updateUserPassword,
	resetPasswordEmail,
	resetPasswordToken,
	googleAuth,
};
