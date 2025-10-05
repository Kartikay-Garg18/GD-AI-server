// mediasoup/worker.js
import * as mediasoup from "mediasoup";

export async function createWorker() {
  const worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
  });

  worker.on("died", () => {
    console.error("❌ Mediasoup worker has died. Restart required.");
    process.exit(1);
  });

  console.log("✅ Mediasoup worker created");
  return worker;
}
