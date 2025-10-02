import Room from "../models/roomSchema.js";
import User from "../models/userSchema.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";
import { scheduleRemindersForMeeting } from "./remiender.js";

// Create Room
export const createMeeting = async (req, res) => {
  if (!req.isAuth) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { roomName, maxParticipants, scheduledAt, isEnd } = req.body;

    if (!roomName) return res.status(400).json({ error: "roomName is required" });
    if (!scheduledAt) return res.status(400).json({ error: "scheduledAt is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const roomCode = await generateRoomCode();

    const room = new Room({
      roomCode,
      roomName,
      createdBy: user._id,
      participants: [user._id],
      maxParticipants: maxParticipants || 10,
      scheduledAt: new Date(scheduledAt),
      isEnd: isEnd || false                
    });

    await room.save();

    res.status(201).json({ message: "Room created successfully", room });

    try {
      await scheduleRemindersForMeeting(room._id);
    } catch (reminderError) {
      console.error("Failed to schedule reminders:", reminderError);
    }


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while creating room" });
  }
};

// Get Room by roomCode
export const getMeeting = async (req, res) => {
  if (!req.isAuth) return res.status(401).json({ message: "Unauthorized" });

  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode })
      .populate("createdBy", "name email")
      .populate("participants", "name email");

    if (!room) return res.status(404).json({ error: "Room not found" });

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching room" });
  }
};

// List all rooms
export const listMeetings = async (req, res) => {
  if (!req.isAuth) return res.status(401).json({ message: "Unauthorized" });

  try {
    const rooms = await Room.find()
      .populate("createdBy", "name email")
      .populate("participants", "name email")
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching rooms" });
  }
};