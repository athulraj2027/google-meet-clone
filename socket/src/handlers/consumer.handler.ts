import { Rooms } from "../store/room";

export const handleGetProducers = async (
  roomId: string,
  peerId: string,
  cb: (data: any) => void,
) => {
  const room = Rooms.get(roomId);
  if (!room) cb({ success: false, message: "Room id not found" });
  let producerList = new Map();
  room?.peers.forEach((peer) => {});
};
