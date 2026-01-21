import { Socket } from "socket.io";
import { handleGetProducers } from "../handlers/consumer.handler";

export function consumerSocket(socket: Socket) {
  socket.on("get-producers", async ({ roomId, peerId }, cb) => {
    handleGetProducers(roomId, peerId, cb);
  });
}
