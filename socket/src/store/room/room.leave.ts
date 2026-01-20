import { Rooms } from "./room.store";

export const leaveRoom = async (roomId: string, user: { peerId: string }) => {
  const room = Rooms.get(roomId);
  if (!room) throw new Error(`No room found with id: ${roomId}`);

  const peer = room.peers.get(user.peerId);
  if (!peer) throw new Error("User not in room");

  peer.consumers?.forEach((consumer) => {
    try {
      consumer.close();
    } catch {}
  });

  peer.producers?.forEach((producer) => {
    try {
      producer.close();
    } catch {}
  });

  peer.transports?.forEach((transport) => {
    try {
      transport.close();
    } catch {}
  });

  room.peers.delete(user.peerId);

  if (room.hostPeerId === user.peerId) {
    room.peers.forEach((p) => {
      p.consumers?.forEach((c) => c.close());
      p.producers?.forEach((p) => p.close());
      p.transports?.forEach((t) => t.close());
    });

    room.router.close();
    Rooms.delete(roomId);
    return { roomClosed: true };
  }

  if (room.peers.size === 0) {
    room.router.close();
    Rooms.delete(roomId);
  }

  return { success: true };
};
