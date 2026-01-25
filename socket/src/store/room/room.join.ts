import { User } from "../../types/room";
import { Rooms, SocketIdToPeer } from "./room.store";

export const joinRoom = async (
  roomId: string,
  user: { peerId: string },
  socketId: string,
) => {
  try {
    const room = Rooms.get(roomId);
    console.log("user received : ", user);

    if (!room) return { ok: false, error: "Room not found" };

    if (room.peers.has(user.peerId))
      return { ok: false, error: "User already in room" };

    const newPeer: User = {
      socketId,
      peerId: user.peerId,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };

    room.peers.set(user.peerId, newPeer);
    SocketIdToPeer.set(socketId, { roomId, peerId: user.peerId });
    
    const existingProducerIds: string[] = [];
    room.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        existingProducerIds.push(producer.id);
      });
    });

    console.log("current producers received:", existingProducerIds);
    return {
      ok: true,
    };
  } catch (err: any) {
    console.error("Join room error:", err);

    return {
      ok: false,
      error: "Internal server error",
    };
  }
};
