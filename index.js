import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import transcribeRoute from './routes/transcribe.js';  
import authRoute from './routes/auth.js';
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

// const PORT = process.env.PORT || 3000;
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
