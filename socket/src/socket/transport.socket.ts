import { Socket } from "socket.io";
import {
  handleConnectTransport,
  handleCreateTransport,
} from "../handlers/transport.handler";

export default function transportSocket(socket: Socket) {
  socket.on("create-transport", async ({ kind }, cb) => {
    handleCreateTransport(socket);
  });
  socket.on("connect-transport", async ({ kind }, cb) => {
    handleConnectTransport(socket);
  });
}
