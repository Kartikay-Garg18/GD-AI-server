// mediasoup/transportManager.js
export async function createWebRtcTransport(room, socketId) {
  const router = room.router;

  const transport = await router.createWebRtcTransport({
    listenIps: [
      { ip: "0.0.0.0", announcedIp: process.env.PUBLIC_IP || "127.0.0.1" },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });

  if (!room.peers.has(socketId)) {
    room.peers.set(socketId, {
      transports: [],
      producers: [],
      consumers: [],
      plainTransports: {},
    });
  }

  room.peers.get(socketId).transports.push(transport);

  return {
    transport,
    params: {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    },
  };
}

export async function connectTransport(room, socketId, transportId, dtlsParameters) {
  const peer = room.peers.get(socketId);
  if (!peer) throw new Error("Peer not found");

  const transport = peer.transports.find((t) => t.id === transportId);
  if (!transport) throw new Error("Transport not found");

  await transport.connect({ dtlsParameters });
  console.log(`🔗 Transport ${transportId} connected for peer ${socketId}`);
}
