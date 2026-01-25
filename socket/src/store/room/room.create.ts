import { createRouter } from "../../mediasoup/router";
import { RoomInterface, User } from "../../types/room";
import { Rooms, SocketIdToPeer } from "./room.store";

export const createRoom = async ({
  user,
  roomId,
  socketId,
}: {
  user: { peerId: string };
  roomId: string;
  socketId: string;
}) => {
  const router = await createRouter(roomId);
  console.log("Router : ", router);
  if (!router) throw new Error("Router creation failed");
  const hostPeer: User = {
    socketId,
    peerId: user.peerId,
    transports: new Map(),
    producers: new Map(),
    consumers: new Map(),
  };
  const peers = new Map<string, User>();
  peers.set(user.peerId, hostPeer);
  SocketIdToPeer.set(socketId, { roomId, peerId: user.peerId });

  const roomDetails: RoomInterface = {
    router,
    hostPeerId: user.peerId,
    peers,
  };
  Rooms.set(roomId, roomDetails);
  return;
};
