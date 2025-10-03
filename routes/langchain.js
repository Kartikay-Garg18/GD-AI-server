import express from "express";
import { getTrendingGDTopics } from "../controllers/langchain.js";

const router = express.Router();

router.get("/trending", getTrendingGDTopics);

export default router;
