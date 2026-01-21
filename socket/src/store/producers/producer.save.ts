import { Producer } from "mediasoup/types";
import { Rooms } from "../room";

export const saveProducer = async (
  roomId: string,
  peerId: string,
  producer: Producer,
) => {
  Rooms.get(roomId)?.peers.get(peerId)?.producers.set(producer.id, producer);
  return 
};
