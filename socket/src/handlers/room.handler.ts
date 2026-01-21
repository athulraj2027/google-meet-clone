import { Socket } from "socket.io";
import { createRoom, joinRoom, leaveRoom } from "../store/room";
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
    // console.log("New room  and token created  : ", token);
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
    console.log("Rtp capabilities : ", rtpCapabilities);
    callback({ success: true, rtpCapabilities });
  } catch (error) {
    callback({ success: false, error: "Fetching rtp capabilities failed" });
  }
};

export const handleLeaveRoom = async (
  socket: Socket,
  roomId: string,
  user: { peerId: string },
  callback: (data: any) => void,
) => {
  try {
    await leaveRoom(roomId, user);
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
