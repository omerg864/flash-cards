import mongoose from 'mongoose';

const userScheme = mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		resetPasswordToken: {
			type: String,
		},
		generations: {
			type: Number,
			default: 2,
		},
		premium: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('User', userScheme);
