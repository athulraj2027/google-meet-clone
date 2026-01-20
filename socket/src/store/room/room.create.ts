import { createRouter } from "../../mediasoup/router";
import { RoomInterface, User } from "../../types/room";
import { Rooms } from "./room.store";
import bcrypt from "bcryptjs";

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
  const token =  crypto.randomUUID();
  const hashedToken = await bcrypt.hash(token, 10);

  const roomDetails: RoomInterface = {
    router,
    hostPeerId: user.peerId,
    peers,
    token: hashedToken,
  };
  Rooms.set(roomId, roomDetails);
  return token;
};
