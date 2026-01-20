import { Socket } from "socket.io";
import {
  handleCloseRoom,
  handleCreateRoom,
  handleGetRtpCapabilities,
  handleJoinRoom,
  handleLeaveRoom,
} from "../handlers/room.handlers";

export default function roomSocket(socket: Socket) {
  socket.on("create-room", ({ user, roomId }, cb) => {
    handleCreateRoom(socket, user, roomId, cb);
  });

  socket.on("join-room", ({ user, roomId }, cb) => {
    handleJoinRoom(socket, roomId, user, cb);
  });

  socket.on("leave-room", ({ user, roomId }, cb) => {
    handleLeaveRoom(socket, roomId, user, cb);
  });

  socket.on("close-room", ({ user, roomId }, cb) => {
    handleCloseRoom(socket, user, roomId, cb);
  });

  socket.on("get-rtpCapabilities", ({ roomId }, cb) => {
    handleGetRtpCapabilities(roomId, cb);
  });
}
