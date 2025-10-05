import fs from "fs";
import { spawn } from "child_process";

export function createSdpFile(ffmpegPort) {
  const sdpContent = `v=0
o=- 0 0 IN IP4 127.0.0.1
s=Mediasoup Audio
c=IN IP4 127.0.0.1
t=0 0
m=audio ${ffmpegPort} RTP/AVP 100
a=rtpmap:100 opus/48000/2
`;

  const sdpPath = `/tmp/mediasoup_audio_${ffmpegPort}.sdp`;
  fs.writeFileSync(sdpPath, sdpContent);
  return sdpPath;
}

export function startFfmpeg(sdpPath, outputFile) {
  return spawn("ffmpeg", [
    "-protocol_whitelist",
    "file,udp,rtp",
    "-i",
    sdpPath,
    "-acodec",
    "pcm_s16le",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-f",
    "wav",
    "pipe:1",
    outputFile,
  ]);
}
