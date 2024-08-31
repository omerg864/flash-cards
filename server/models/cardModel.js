import mongoose from 'mongoose';

const cardScheme = mongoose.Schema({
    front: {
        type: String,
        required: true
    },
    back: {
        type: String,
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Subject'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    isMemorized: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

export default mongoose.model('Card', cardScheme);