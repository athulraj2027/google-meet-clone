import { RouterRtpCodecCapability } from "mediasoup/types";
import { getWorker } from "./worker";

const mediaCodecs: RouterRtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: "video",
    mimeType: "video/VP8", // MUST exist
    clockRate: 90000,
  },
];

export async function createRouter(roomId: string) {
  try {
    const worker = await getWorker();
    const router = await worker.createRouter({ mediaCodecs });
    return router;
  } catch (error) {
    console.log("failed to create router for ", roomId);
    throw new Error("Router creation failed");
  }
}
