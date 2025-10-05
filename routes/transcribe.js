import express from "express";
import { transcribeLocalFile } from "../controllers/transcribe.js";

const router = express.Router();

router.post("/local", transcribeLocalFile);

export default router;
