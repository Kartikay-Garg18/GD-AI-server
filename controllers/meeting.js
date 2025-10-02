import Room from "../models/roomSchema.js";
import User from "../models/userSchema.js";

// Generate unique 6-character room code
const generateRoomCode = async () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code;
  let exists = true;

  while (exists) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const room = await Room.findOne({ roomCode: code });
    if (!room) exists = false;
  }

  return code;
};

// Create Room
export const createMeeting = async (req, res) => {
  if (!req.isAuth) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { roomName, maxParticipants } = req.body;

    if (!roomName) return res.status(400).json({ error: "roomName is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const roomCode = await generateRoomCode();

    const room = new Room({
      roomCode,
      roomName,
      createdBy: user._id,
      participants: [user._id],
      maxParticipants: maxParticipants || 10
    });

    await room.save();

    res.status(201).json({ message: "Room created successfully", room });
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