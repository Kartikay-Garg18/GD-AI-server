import Room from "../models/roomSchema.js";

export const generateRoomCode = async () => {
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