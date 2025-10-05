// mediasoup/producerManager.js
import { createPlainAudioConsumer } from "./audioConsumer.js";

export async function produce(room, socketId, transportId, kind, rtpParameters) {
  const peer = room.peers.get(socketId);
  if (!peer) throw new Error("Peer not found");

  const transport = peer.transports.find((t) => t.id === transportId);
  if (!transport) throw new Error("Transport not found");

  const producer = await transport.produce({ kind, rtpParameters });
  peer.producers.push(producer);

  console.log(`🎙️ New producer (${kind}) from ${socketId}: ${producer.id}`);

  if (kind === "audio") {
    await createPlainAudioConsumer(room, producer);
  }

  return producer.id;
}

export async function consume(room, socketId, transportId, producerId, rtpCapabilities) {
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

  console.log(`📡 New consumer created for peer ${socketId}`);
  return {
    id: consumer.id,
    producerId,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
  };
}
