import mongoose from 'mongoose';

const fileScheme = mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		uri: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

export default mongoose.model('File', fileScheme);
