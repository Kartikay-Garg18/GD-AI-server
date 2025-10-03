import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import transcribeRoute from './routes/transcribe.js';  
import authRoute from './routes/auth.js';
import meetingRoutes from './routes/meeting.js';
import trendingRoutes from "./routes/langchain.js";
import connectDB from './databases/db.js';

dotenv.config();

const app = express();

connectDB();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


// Attach routes
app.use('/transcribe', transcribeRoute);
app.use('/auth', authRoute);
app.use('/meetings', meetingRoutes);
app.use("/langchain", trendingRoutes);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});