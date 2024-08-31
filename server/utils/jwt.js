import jwt from 'jsonwebtoken';

const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: '30d',
	});
};

export const decodeToken = (token) => {
	try {
		return jwt.verify(token, process.env.JWT_SECRET).id;
	} catch (err) {
		console.log(err);
		return null;
	}
};

export { generateToken, decodeToken };
