import mongoose from 'mongoose';

const subjectScheme = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    cards: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Card'
        }
    ],
    chatID: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model('Subject', subjectScheme);