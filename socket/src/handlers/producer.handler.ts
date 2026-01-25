import { RtpParameters } from "mediasoup/types";
import { getTransport } from "../store/transports";
import { saveProducer } from "../store/producers/producer.save";
import { Rooms } from "../store/room";
import { Socket } from "socket.io";

export const handleProduce = async (
  socket: Socket,
  roomId: string,
  transportId: string,
  kind: "video" | "audio",
  rtpParameters: RtpParameters,
  peerId: string,
  callback: (data: any) => void,
) => {
  // get transport
  console.log("hiddfas");
  let producer;
  const data = await getTransport(transportId, peerId, roomId);
  // create produce
  if (data.transport) {
    producer = await data.transport.produce({
      kind,
      rtpParameters,
      appData: {},
    });
  }
  if (!producer) {
    console.log("No producer found");
    return;
  }

  // console.log("Producer created : ", producer);
  await saveProducer(roomId, peerId, producer);
  callback({ success: true, producerId: producer.id });
  socket.to(roomId).emit("new-producer", {
    producer: {
      peerId,
      producerId: producer.id,
      kind,
      paused: producer.paused,
    },
  });
  // save producer
  // return
};

export const handlePauseProduce = async (
  socket: Socket,
  kind: "video" | "audio",
  producerId: string,
  roomId: string,
  peerId: string,
) => {
  const room = Rooms.get(roomId);
  if (!room) return;
  const producer = room.peers.get(peerId)?.producers.get(producerId);
  await producer?.pause();
  socket.to(roomId).emit("producer-paused", { kind, peerId });
  return;
};

export const handleResumeProduce = async (
  socket: Socket,
  kind: "video" | "audio",
  producerId: string,
  roomId: string,
  peerId: string,
) => {
  const room = Rooms.get(roomId);
  if (!room) return;
  const producer = room.peers.get(peerId)?.producers.get(producerId);
  await producer?.resume();
  socket.to(roomId).emit("producer-resumed", { kind, peerId });
  return;
};
