import File from '../models/fileModel.js';

const createFile = (uri, type) => {
    const file = new File({
        uri,
        type,
    });
    return file.save();
}

export { createFile };