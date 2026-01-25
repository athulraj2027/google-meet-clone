import { Socket } from "socket.io";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  Rooms,
  SocketIdToPeer,
} from "../store/room";
import { getRtpCapabilities } from "../store/room/room.getRtpCapabilities";

export const handleCreateRoom = async (
  socket: Socket,
  user: { peerId: string },
  roomId: string,
  callback: (data: any) => void,
) => {
  try {
    // console.log("Creating room...");
    await createRoom({ user, roomId, socketId: socket.id });
    socket.join(roomId);
    callback({ success: true });
  } catch (err) {
    callback({ success: false, error: "Room creation failed" });
  }
};

export const handleJoinRoom = async (
  socket: Socket,
  roomId: string,
  user: { peerId: string },
  callback: (data: any) => void,
) => {
  try {
    await joinRoom(roomId, user, socket.id);
    socket.join(roomId);
    callback({ success: true });
    socket.to(roomId).emit("new-user", { peerId: user.peerId });
  } catch (error) {
    callback({ success: false, error: "Room creation failed" });
  }
};

export const handleGetRtpCapabilities = async (
  roomId: string,
  callback: (data: any) => void,
) => {
  try {
    const rtpCapabilities = await getRtpCapabilities(roomId);
    // console.log("Rtp capabilities : ", rtpCapabilities);
    callback({ success: true, rtpCapabilities });
  } catch (error) {
    callback({ success: false, error: "Fetching rtp capabilities failed" });
  }
};

export const handleLeaveRoom = async (
  socket: Socket,
  roomId: string,
  peerId: string,
  callback: (data: any) => void,
) => {
  try {
    await leaveRoom(roomId, peerId);
    socket.leave(roomId);
    socket.to(roomId).emit("user-left-room", { peerId });
    callback({ success: true });
  } catch (error) {
    callback({ success: false, error: "Room creation failed" });
  }
};

export const handleCloseRoom = async (
  socket: Socket,
  user: { username: string; socketId: string },
  roomId: string,
  callback: (data: any) => void,
) => {
  try {
  } catch (error) {}
};

export const handleDisconnectUser = async (socket: Socket) => {
  const socketPeer = SocketIdToPeer.get(socket.id);
  if (!socketPeer) return;
  const { roomId, peerId } = socketPeer;
  const room = Rooms.get(roomId);
  if (!room) return;

  const peer = room.peers.get(peerId);
  if (!peer) return;

  peer.producers?.forEach((producer) => {
    try {
      producer.close();
    } catch {}
  });

  peer.consumers?.forEach((consumer) => {
    try {
      consumer.close();
    } catch {}
  });

  peer.transports?.forEach((transport) => {
    try {
      transport.close();
    } catch {}
  });

  room.peers.delete(peerId);

  if (room.peers.size === 0) {
    room.router.close();
    Rooms.delete(roomId);
  }
  peer.producers.forEach((producer) => producer.close());

  socket.to(roomId).emit("user-left-room", { peerId });
};
