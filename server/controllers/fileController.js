import File from '../models/fileModel.js';

const createFile = (name, uri, type) => {
	const file = new File({
		name,
		uri,
		type,
	});
	return file.save();
};

export { createFile };
