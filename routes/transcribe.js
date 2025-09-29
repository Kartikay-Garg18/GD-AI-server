import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/local", async (req, res) => {
  try {
    const filePath = path.resolve("triii.mp3");

    if (!fs.existsSync(filePath)) {
      console.log("File not found");
      return res.status(404).json({ error: "Audio file not found in project root" });
    }

    const stats = fs.statSync(filePath);
    console.log("File size (bytes):", stats.size);
    if (stats.size === 0) {
      return res.status(400).json({ error: "Audio file is empty" });
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(500).json({ error: "Deepgram API key not set in .env" });
    }

    const fileStream = fs.readFileSync(filePath);
    const deepgramResponse = await axios.post(
      "https://api.deepgram.com/v1/listen",
      fileStream,
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/wav", // Use audio/wav if WAV file
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const transcript =
    deepgramResponse.data?.results?.channels[0]?.alternatives[0]?.transcript || "";
    console.log("Transcript ", transcript);

    const analyzeResponse = await axios.post(
      "https://bc5163c1d332.ngrok-free.app/analyze",
      { transcript }, // Send as JSON body
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Transcript sent to analyze endpoint: ", analyzeResponse.data);

    res.json({
      transcript,
      analyzeResponse: analyzeResponse.data,
    });
  } catch (error) {
    console.error(
      "Error during transcription or sending to analyze endpoint:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to transcribe or send transcript",
      details: error.response?.data || error.message,
    });
  }
});

export default router;
