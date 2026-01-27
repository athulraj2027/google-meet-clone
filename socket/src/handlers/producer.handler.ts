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
  let producer;
  const { transport } = await getTransport(transportId, peerId, roomId);
  // create produce

  producer = await transport?.produce({
    kind,
    rtpParameters,
    appData: { peerId },
  });

  if (!producer) {
    console.log("No producer found");
    return;
  }

  producer.observer.on("pause", () => {
    socket.to(roomId).emit("producerpaused", { producerId: producer.id });
  });
  producer.observer.on("resume", () => {
    socket.to(roomId).emit("producerresumed", { producerId: producer.id });
  });
  producer.observer.on("close", () => {
    socket
      .to(roomId)
      .emit("producerclosed", { producerId: producer.id });
  });

  // console.log("Producer created : ", producer);
  await saveProducer(roomId, peerId, producer);
  callback({ id: producer.id });
  socket.to(roomId).emit("new-producer", {
    producer: {
      peerId,
      producerId: producer.id,
      kind,
      paused: producer.paused,
    },
  });
};

export const handlePauseProduce = async (
  kind: "video" | "audio",
  producerId: string,
  roomId: string,
  peerId: string,
  cb: (data: any) => void,
) => {
  const room = Rooms.get(roomId);
  if (!room) return;
  const producer = room.peers.get(peerId)?.producers.get(producerId);
  // console.log("pausing producer : ", producer?.id);
  if (!producer) {
    cb({ success: false });
    return;
  }
  await producer.pause();
  cb({ success: true, producerId });
};

export const handleResumeProduce = async (
  kind: "video" | "audio",
  producerId: string,
  roomId: string,
  peerId: string,
) => {
  const room = Rooms.get(roomId);
  if (!room) return;
  const producer = room.peers.get(peerId)?.producers.get(producerId);
  await producer?.resume();
};
