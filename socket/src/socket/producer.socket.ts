import { Socket } from "socket.io";
import {
  handlePauseProduce,
  handleProduce,
  handleResumeProduce,
  handleStopScreenshare,
} from "../handlers/producer.handler";

export function producerSocket(socket: Socket) {
  socket.on(
    "produce",
    async (
      { roomId, transportId, kind, rtpParameters, peerId, appData },
      cb,
    ) => {
      handleProduce(
        socket,
        roomId,
        transportId,
        kind,
        rtpParameters,
        peerId,
        appData,
        cb,
      );
    },
  );

  socket.on(
    "pause-produce",
    async ({ kind, producerId, roomId, peerId }, cb) => {
      console.log("producer id : ", producerId);
      handlePauseProduce(kind, producerId, roomId, peerId, cb);
    },
  );

  socket.on("resume-produce", async ({ kind, producerId, roomId, peerId }) => {
    handleResumeProduce(kind, producerId, roomId, peerId);
  });

  socket.on("stop-screen-share", async ({ producerId, peerId, roomId }) => {
    handleStopScreenshare(producerId, peerId, roomId);
  });
}
