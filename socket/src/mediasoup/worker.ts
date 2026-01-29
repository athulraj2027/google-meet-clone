import * as mediasoup from "mediasoup";
import { Worker } from "mediasoup/types";

let worker: Worker;

export async function createWorker() {
  try {
    worker = await mediasoup.createWorker({
      rtcMinPort: 49152,
      rtcMaxPort: 65535,
      logLevel: "warn",
      logTags: [],
    });

    // console.log("New worker created : ",worker)

    worker.on("died", (error) => {
      console.error("mediasoup worker has died", error);
      process.exit(1);
    });
  } catch (error) {
    console.log("Creating worker failed : ", error);
  }
}

export async function getWorker() {
  return worker;
}
