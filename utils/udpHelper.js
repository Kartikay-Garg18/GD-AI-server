import dgram from "dgram";

export async function getFreeUdpPort() {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    socket.bind(0, () => {
      const { port } = socket.address();
      socket.close(() => resolve(port));
    });
    socket.on("error", reject);
  });
}

export function listenToAudio(port) {
  const socket = dgram.createSocket("udp4");

  socket.on("message", (msg) => {
    console.log(`🎧 Received ${msg.length} bytes`);
    console.log("🔊 Base64 Preview:", msg.toString("base64").slice(0, 80), "...");
  });

  socket.bind(port, "127.0.0.1", () => {
    console.log(`👂 Listening on 127.0.0.1:${port}`);
  });
}
