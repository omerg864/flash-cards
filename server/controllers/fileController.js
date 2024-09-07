import File from '../models/fileModel.js';

const createFile = (name, uri, type) => {
	const file = new File({
		name,
		uri,
		type,
	});
	return file.save();
};

const getFile = async (id) => {
    return await File.findById(id);
};

const deleteFile = async (id) => {
    return await File.findByIdAndDelete(id);
}

export { createFile, getFile, deleteFile };
