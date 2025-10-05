// mediasoupServer.js
import { createWorker } from "./mediasoup/worker.js";
import { getOrCreateRoom, getRoom, cleanupPeer } from "./mediasoup/roomManager.js";
import { createWebRtcTransport, connectTransport } from "./mediasoup/transportManager.js";
import { produce, consume } from "./mediasoup/producerManager.js";

export async function createMediasoupServer(io) {
  const worker = await createWorker();

  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);
    let currentRoomId = null;

    socket.on("joinRoom", async ({ roomId }) => {
      try {
        currentRoomId = roomId;
        const room = await getOrCreateRoom(worker, roomId);
        socket.emit("rtpCapabilities", room.router.rtpCapabilities);
      } catch (err) {
        console.error("❌ joinRoom:", err.message);
      }
    });

    socket.on("createTransport", async ({ roomId }, callback) => {
      try {
        const room = await getOrCreateRoom(worker, roomId);
        const { transport, params } = await createWebRtcTransport(room, socket.id);
        callback(params);
      } catch (err) {
        console.error("❌ createTransport:", err.message);
        callback({ error: err.message });
      }
    });

    socket.on("connectTransport", async ({ transportId, dtlsParameters }) => {
      try {
        const room = getRoom(currentRoomId);
        await connectTransport(room, socket.id, transportId, dtlsParameters);
      } catch (err) {
        console.error("❌ connectTransport:", err.message);
      }
    });

    socket.on("produce", async ({ transportId, kind, rtpParameters }, callback) => {
      try {
        const room = getRoom(currentRoomId);
        const producerId = await produce(room, socket.id, transportId, kind, rtpParameters);
        callback({ id: producerId });

        // Notify other peers
        for (const [peerId] of room.peers.entries()) {
          if (peerId !== socket.id) {
            io.to(peerId).emit("newProducer", { producerId, peerId: socket.id });
          }
        }
      } catch (err) {
        console.error("❌ produce:", err.message);
        callback({ error: err.message });
      }
    });

    socket.on("consume", async ({ transportId, producerId, rtpCapabilities }, callback) => {
      try {
        const room = getRoom(currentRoomId);
        const consumerParams = await consume(room, socket.id, transportId, producerId, rtpCapabilities);
        callback(consumerParams);
      } catch (err) {
        console.error("❌ consume:", err.message);
        callback({ error: err.message });
      }
    });

    socket.on("disconnect", () => {
      if (currentRoomId) cleanupPeer(currentRoomId, socket.id);
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return { worker };
}
