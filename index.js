import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./databases/db.js";
import { createMediasoupServer } from "./mediasoupServer.js";

import transcribeRoute from "./routes/transcribe.js";
import authRoute from "./routes/auth.js";
import meetingRoutes from "./routes/meeting.js";
import langchainRoutes from "./routes/langchain.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/test", (_, res) => res.send("Backend is reachable!"));

app.use("/transcribe", transcribeRoute);
app.use("/auth", authRoute);
app.use("/meetings", meetingRoutes);
app.use("/langchain", langchainRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const mediasoupServer = await createMediasoupServer(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});