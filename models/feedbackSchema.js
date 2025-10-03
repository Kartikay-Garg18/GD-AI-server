const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomname: {
        type: String,
        required: true,
        trim: true
    },
    scheduleAt: {
        type: Date,
        required: true
    },
    feedback: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);