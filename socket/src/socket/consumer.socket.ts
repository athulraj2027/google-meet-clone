import { Socket } from "socket.io";
import {
  handleConsume,
  handleGetProducers,
  handleResumeConsumer,
} from "../handlers/consumer.handler";

export function consumerSocket(socket: Socket) {
  socket.on("get-producers", async ({ roomId, peerId }, cb) => {
    handleGetProducers(roomId, peerId, cb);
  });

  socket.on(
    "consume",
    async (
      { producer, roomId, consumerPeerId, rtpCapabilities, transportId },
      cb,
    ) => {
      handleConsume(
        socket,
        roomId,
        consumerPeerId,
        producer,
        rtpCapabilities,
        transportId,
        cb,
      );
    },
  );

  socket.on("resume-consumer", async ({ peerId, roomId, consumerId }) => {
    handleResumeConsumer(peerId, roomId, consumerId);
  });
}
