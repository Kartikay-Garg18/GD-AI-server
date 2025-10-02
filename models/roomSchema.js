import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 6,
        maxlength: 10
    },
    roomName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isEnd : {
        type: Boolean,
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    maxParticipants: {
        type: Number,
        default: 10, 
        min: 1
    },
    scheduledAt: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > new Date(); 
            },
            message: 'Scheduled time must be in the future.'
        }
    }

}, { timestamps: true });

const Room = mongoose.model("Room", roomSchema);
export default Room;