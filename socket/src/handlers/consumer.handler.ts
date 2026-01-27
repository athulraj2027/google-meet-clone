import { AppData, RtpCapabilities } from "mediasoup/types";
import { Rooms } from "../store/room";
import { getTransport } from "../store/transports";
import { addConsumer } from "../store/consumers/consumer.add";

interface ProducersListInterface {
  producerId: string;
  peerId: string;
  appData: AppData;
  kind: "audio" | "video";
  paused: boolean;
}

export const handleGetProducers = async (
  roomId: string,
  peerId: string,
  cb: (data: any) => void,
) => {
  const room = Rooms.get(roomId);

  if (!room) cb({ success: false, message: "Room id not found" });
  let producerList: ProducersListInterface[] = [];
  room?.peers.forEach((peer, id) => {
    if (id === peerId) return;

    peer.producers.forEach((producer) => {
      producerList.push({
        producerId: producer.id,
        peerId: id,
        appData: producer.appData,
        kind: producer.kind,
        paused: producer.paused,
      });
    });
  });

  console.log("producerList : ", producerList);
  cb({
    success: true,
    producers: producerList,
  });
};

export const handleConsume = async (
  roomId: string,
  consumerPeerId: string,
  producer: {
    producerId: string;
    peerId: string;
    kind: "audio" | "video";
    appData: AppData;
    paused: boolean;
  },
  rtpCapabilities: RtpCapabilities,
  transportId: string,
  cb: (data: any) => void,
) => {
  // console.log("handling consume ...", producer);
  const { producerId, appData } = producer;

  const data = await getTransport(transportId, consumerPeerId, roomId);
  console.log(data);
  if (!data.transport) {
    cb({ success: false, message: "Transport not found" });
    return;
  }
  const consumer = await data.transport.consume({
    producerId,
    rtpCapabilities,
    appData,
  });

  if (!consumer) {
    console.log("no consumer created");
    cb({ success: false, message: "Consumer creation failed" });
    return;
  }

  await addConsumer(roomId, consumerPeerId, consumer);
  const params = {
    id: consumer.id,
    producerId,
    appData: consumer.appData,
    kind: consumer.kind,
    rtpParameters: consumer.rtpParameters,
    producerPeerId: producer.peerId,
  };
  console.log("the params sending from the consume event");
  cb({ success: true, params });
};

export const handleResumeConsumer = async (
  peerId: string,
  roomId: string,
  consumerId: string,
) => {
  const consumer = Rooms.get(roomId)
    ?.peers.get(peerId)
    ?.consumers.get(consumerId);
  if (consumer?.paused) await consumer.resume();
  return;
};
