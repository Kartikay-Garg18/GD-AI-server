import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { createMediasoupServer } from './mediasoupServer.js';
import cors from 'cors';
import transcribeRoute from './routes/transcribe.js';  
import authRoute from './routes/auth.js';
import meetingRoutes from './routes/meeting.js';
import trendingRoutes from './routes/langchain.js';
import connectDB from './databases/db.js';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
  res.send("Backend is reachable!");
});

app.use('/transcribe', transcribeRoute);
app.use('/auth', authRoute);
app.use('/meetings', meetingRoutes);
app.use('/langchain', trendingRoutes);

const mediasoupServer = await createMediasoupServer();

const socketRoomMap = new Map();

io.on('connection', (socket) => {
  console.log('⚡ Socket connected:', socket.id);
  let currentRoomId = null;

  socket.on('joinRoom', async ({ roomId }) => {
    try {
      currentRoomId = roomId;
      socketRoomMap.set(socket.id, roomId);

      const room = await mediasoupServer.getOrCreateRoom(roomId);
      socket.emit('rtpCapabilities', room.router.rtpCapabilities);
    } catch (err) {
      console.error('❌ Error joining room:', err);
    }
  });


  socket.on('createTransport', async ({ roomId }, callback) => {
    try {
      const { transport, params } = await mediasoupServer.createWebRtcTransport(roomId, socket.id);
      callback(params);
    } catch (err) {
      console.error('❌ Error creating transport:', err);
      callback({ error: err.message });
    }
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters }) => {
    try {
      await mediasoupServer.connectTransport(currentRoomId, socket.id, transportId, dtlsParameters);
    } catch (err) {
      console.error('❌ Error connecting transport:', err);
    }
  });

  socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
    try {
      const producerId = await mediasoupServer.produce(currentRoomId, socket.id, transportId, kind, rtpParameters);
      callback({ id: producerId });

      const room = await mediasoupServer.getOrCreateRoom(currentRoomId);

      for (const [peerSocketId] of room.peers.entries()) {
        if (peerSocketId !== socket.id) {
        io.to(peerSocketId).emit("newProducer", { producerId, peerId: socket.id, });
        }
      }


      for (const [peerSocketId, peer] of room.peers.entries()) {
        if (peerSocketId === socket.id) continue;
        for (const existingProducer of peer.producers) {
          socket.emit("newProducer", { producerId: existingProducer.id });
        }
      }

    } catch (err) {
      console.error('❌ Error producing:', err);
      callback({ error: err.message });
    }
  });

  socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
    try {
      const consumerParams = await mediasoupServer.consume(currentRoomId, socket.id, transportId, producerId, rtpCapabilities);
      callback(consumerParams);
    } catch (err) {
      console.error('❌ Error consuming:', err);
      callback({ error: err.message });
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomId) {
      mediasoupServer.cleanupPeer(currentRoomId, socket.id);
    }
    socketRoomMap.delete(socket.id);
    console.log('❌ Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
