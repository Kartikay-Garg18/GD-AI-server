// mediasoup/roomManager.js
const rooms = new Map();

export async function getOrCreateRoom(worker, roomId) {
  if (rooms.has(roomId)) return rooms.get(roomId);

  const mediaCodecs = [
    { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
    { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
  ];

  const router = await worker.createRouter({ mediaCodecs });
  const room = { router, peers: new Map() };
  rooms.set(roomId, room);

  console.log(`🆕 Created new room: ${roomId}`);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId);
}

export function cleanupPeer(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room || !room.peers.has(socketId)) return;

  const peer = room.peers.get(socketId);
  peer.consumers.forEach((c) => c.close());
  peer.producers.forEach((p) => p.close());
  peer.transports.forEach((t) => t.close());

  room.peers.delete(socketId);
  console.log(`🧹 Cleaned up peer ${socketId} in room ${roomId}`);
}
