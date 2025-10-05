import fs from "fs";
import axios from "axios";
import { getFreeUdpPort, listenToAudio } from "../utils/udpHelper.js";
import { createSdpFile, startFfmpeg } from "../utils/ffmpegHelper.js";

export async function createPlainAudioConsumer(room, producer) {
  const router = room.router;

  const plainTransport = await router.createPlainTransport({
    listenIp: { ip: "127.0.0.1" },
    rtcpMux: false,
    comedia: false,
  });

  console.log("🎧 Plain RTP Transport created:", plainTransport.tuple.localPort);

  const consumer = await plainTransport.consume({
    producerId: producer.id,
    rtpCapabilities: router.rtpCapabilities,
    paused: false,
  });

  const debugPort = await getFreeUdpPort();
  const ffmpegPort = await getFreeUdpPort();

  listenToAudio(debugPort);

  await plainTransport.connect({
    ip: "127.0.0.1",
    port: ffmpegPort,
    rtcpPort: ffmpegPort + 1,
  });

  const sdpPath = createSdpFile(ffmpegPort);
  const outputFile = `/tmp/audio_${ffmpegPort}.wav`;

  const ffmpeg = startFfmpeg(sdpPath, outputFile);

  ffmpeg.stdout.on("data", (chunk) => {
    console.log("🔊 PCM Data:", chunk.toString("base64").slice(0, 80), "...");
  });

  ffmpeg.stderr.on("data", (data) => {
    const msg = data.toString();
    if (!msg.includes("size=") && !msg.includes("bitrate=")) {
      console.error("FFmpeg:", msg.trim());
    }
  });

  ffmpeg.on("close", async (code) => {
    console.log(`✅ FFmpeg finished (${code}). File: ${outputFile}`);
    try {
      const response = await axios.post("http://localhost:4000/transcribe/local", {
        filePath: outputFile,
      });
      console.log("📝 Transcription:", response.data);
    } catch (err) {
      console.error("❌ Transcription error:", err.response?.data || err.message);
    }
  });
}
