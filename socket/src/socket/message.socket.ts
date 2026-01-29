import { Socket } from "socket.io";
import { Rooms } from "../store/room";

export function messageSocket(socket: Socket) {
  socket.on("send-message", async ({ peerId, roomId, message }, cb) => {
    const room = Rooms.get(roomId);
    socket.to(roomId).emit("message-received", { peerId, message });
    cb();
  });

}

