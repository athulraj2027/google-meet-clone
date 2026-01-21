import { Socket } from "socket.io";
import {
  handleConnectTransport,
  handleCreateTransport,
} from "../handlers/transport.handler";

export  function transportSocket(socket: Socket) {
  socket.on("create-transport", async ({ direction, roomId, peerId }, cb) => {
    handleCreateTransport(direction, roomId, peerId, cb);
  });
  socket.on(
    "connect-transport",
    async ({ transportId, dtlsParameters, roomId, peerId }, cb) => {
      handleConnectTransport(  
        transportId,
        dtlsParameters,
        roomId,
        peerId,
        cb,
      );
    },
  );
}
