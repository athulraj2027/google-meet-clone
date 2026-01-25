import { Consumer } from "mediasoup/types";
import { Rooms } from "../room";

export const addConsumer = async (
  roomId: string,
  peerId: string,
  consumer: Consumer,
) => {
  Rooms.get(roomId)?.peers.get(peerId)?.consumers.set(consumer.id, consumer);
};
