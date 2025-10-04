import * as mediasoup from "mediasoup";

const rooms = new Map();

export async function createMediasoupServer() {
  const worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
  });

  console.log("✅ Mediasoup worker created");

  async function getOrCreateRoom(roomId) {
    if (rooms.has(roomId)) return rooms.get(roomId);

    const mediaCodecs = [
      { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
      { kind: "video", mimeType: "video/VP8", clockRate: 90000 },
    ];

    const router = await worker.createRouter({ mediaCodecs });
    const room = {
      router,
      peers: new Map(),
    };
    rooms.set(roomId, room);
    console.log(`🆕 Created new room: ${roomId}`);
    return room;
  }

  async function createWebRtcTransport(roomId, socketId) {
    const room = await getOrCreateRoom(roomId);
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

  async function connectTransport(
    roomId,
    socketId,
    transportId,
    dtlsParameters
  ) {
    const room = rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    const peer = room.peers.get(socketId);
    if (!peer) throw new Error("Peer not found");

    const transport = peer.transports.find((t) => t.id === transportId);
    if (!transport) throw new Error("Transport not found");

    await transport.connect({ dtlsParameters });
  }

  async function produce(roomId, socketId, transportId, kind, rtpParameters) {
    const room = rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    const peer = room.peers.get(socketId);
    if (!peer) throw new Error("Peer not found");

    const transport = peer.transports.find((t) => t.id === transportId);
    if (!transport) throw new Error("Transport not found");

    const producer = await transport.produce({ kind, rtpParameters });
    peer.producers.push(producer);

    console.log(`🎙️ New producer from ${socketId}: ${producer.id} (${kind})`);
    return producer.id;
  }

  async function consume(
    roomId,
    socketId,
    transportId,
    producerId,
    rtpCapabilities
  ) {
    const room = rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    const peer = room.peers.get(socketId);
    if (!peer) throw new Error("Peer not found");

    const router = room.router;

    if (!router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error("Client cannot consume this producer");
    }

    const transport = peer.transports.find((t) => t.id === transportId);
    if (!transport) throw new Error("Transport not found");

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: false,
    });

    peer.consumers.push(consumer);

    return {
      id: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  function cleanupPeer(roomId, socketId) {
    const room = rooms.get(roomId);
    if (!room || !room.peers.has(socketId)) return;

    const peer = room.peers.get(socketId);

    peer.consumers.forEach((c) => c.close());
    peer.producers.forEach((p) => p.close());
    peer.transports.forEach((t) => t.close());

    room.peers.delete(socketId);
    console.log(`🧹 Cleaned up peer ${socketId} in room ${roomId}`);
  }

  return {
    getOrCreateRoom,
    createWebRtcTransport,
    connectTransport,
    produce,
    consume,
    cleanupPeer,
  };
}
