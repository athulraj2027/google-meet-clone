import { Rooms } from "../room";
import { mediasoupCreateTransport } from "../../mediasoup/transport";

export const createTransport = async (
  roomId: string,
  peerId: string,
  direction: string,
) => {
  const room = Rooms.get(roomId);
  if (!room) return { success: false, message: "Room not found" };
  const transport = await mediasoupCreateTransport(room.router, direction);
  if (!transport)
    return { success: false, message: "Creating transport failed" };
  const peer = room.peers.get(peerId);
  peer?.transports.set(transport.id, transport);
  console.log("transportId : ", transport.id);

  return {
    id: transport.id,
    iceParameters: transport.iceParameters,
    iceCandidates: transport.iceCandidates,
    dtlsParameters: transport.dtlsParameters,
  };
};

export const getTransport = async (
  transportId: string,
  peerId: string,
  roomId: string,
) => {
  const transport = Rooms.get(roomId)
    ?.peers.get(peerId)
    ?.transports.get(transportId);

  // console.log(
  //   "User transports : ",
  //   Rooms.get(roomId)?.peers.get(peerId)?.transports,
  // );
  console.log("Transport id argument : ", transportId);
  if (!transport) return { success: false, message: "Transport not found" };
  // console.log("Transport : ", transport);
  return { success: true, transport };
};
