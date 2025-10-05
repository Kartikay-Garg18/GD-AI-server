import axios from "axios";
import fs from "fs";

export const transcribeLocalFile = async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Audio file not found" });
    }

    const fileStream = fs.readFileSync(filePath);

    const response = await axios.post(
      "https://api.deepgram.com/v1/listen",
      fileStream,
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/wav",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const transcript =
      response.data?.results?.channels[0]?.alternatives[0]?.transcript || "";

    res.json({ transcript });
  } catch (err) {
    console.error("❌ Deepgram error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
