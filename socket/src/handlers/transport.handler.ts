import { DtlsParameters } from "mediasoup/types";
import { createTransport, getTransport } from "../store/transports";
import { mediasoupConnectTransport } from "../mediasoup/transport";

export const handleCreateTransport = async (
  direction: string,
  roomId: string,
  peerId: string,
  cb: (data: any) => void,
) => {
  console.log("Create transport called");
  const transportParams = await createTransport(roomId, peerId, direction);
  //   console.log("Created transport : ", transportParams);
  cb(transportParams);
};

export const handleConnectTransport = async (
  transportId: string,
  dtlsParameters: DtlsParameters,
  roomId: string,
  peerId: string,
  cb: (data: any) => void,
) => {
  const data = await getTransport(transportId, peerId, roomId);
  // console.log("data received  : ", data);
  if (data.transport)
    await mediasoupConnectTransport(data.transport, dtlsParameters);
  cb({ success: true });
};
