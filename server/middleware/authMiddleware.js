import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

const protectUser = asyncHandler(async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer ')
	) {
		try {
			token = req.headers.authorization.split(' ')[1];
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			req.user = await User.findById(decoded.id).select('-password');
			if (!req.user) {
				res.status(404);
				throw new Error('User not found');
			}
			next();
		} catch (error) {
			console.log(error);
			res.status(401);
			throw new Error('Not authorized');
		}
	}
	if (!token) {
		res.status(401);
		throw new Error('Not authorized, no token provided');
	}
});

export { protectUser };
