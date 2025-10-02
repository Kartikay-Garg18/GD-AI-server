import express from "express";
import { createMeeting, getMeeting, listMeetings } from '../controllers/meeting.js';
import { authenticate } from "../middlewares/isauth.js";
const router = express.Router();

router.post("/", authenticate, createMeeting);

router.get("/", authenticate, listMeetings);

router.get("/:roomCode", authenticate, getMeeting);

export default router;