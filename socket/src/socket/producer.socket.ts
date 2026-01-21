import { Socket } from "socket.io";
import {
  handlePauseProduce,
  handleProduce,
  handleResumeProduce,
} from "../handlers/producer.handler";

export  function producerSocket(socket: Socket) {
  socket.on(
    "produce",
    async ({ roomId, transportId, kind, rtpParameters, peerId }, cb) => {
      handleProduce(roomId, transportId, kind, rtpParameters, peerId, cb);
    },
  );

  socket.on("pause-produce", async ({ kind, roomId, peerId }) => {
    handlePauseProduce(socket, kind, roomId, peerId);
  });

  socket.on("resume-produce", async ({ kind, roomId, peerId }) => {
    handleResumeProduce(socket, kind, roomId, peerId);
  });
}
