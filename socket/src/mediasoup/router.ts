import { getWorker } from "./worker";

export async function createRouter(roomId: string) {
  try {
    const worker = await getWorker();
    const router = await worker.createRouter();
    return router;
  } catch (error) {
    console.log("failed to create router for ", roomId);
    throw new Error("Router creation failed");
  }
}
