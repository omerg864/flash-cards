import mongoose from 'mongoose';

const fileScheme = mongoose.Schema({
    uri: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('File', fileScheme);