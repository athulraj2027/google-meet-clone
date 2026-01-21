import {
  DtlsParameters,
  Router,
  Transport,
  WebRtcTransport,
} from "mediasoup/types";

export const mediasoupCreateTransport = async (
  router: Router,
  direction: string,
) => {
  try {
    const transport: WebRtcTransport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: "0.0.0.0",
          announcedIp: process.env.ANNOUNCED_IP as string,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      appData: { direction },
    });

    return transport;
  } catch (error) {
    console.log("Error in creating transport : ", error);
  }
};

export const mediasoupConnectTransport = async (
  transport: Transport,
  dtlsParameters: DtlsParameters,
) => {
  console.log("dtlsParams", dtlsParameters);
  await transport.connect({ dtlsParameters });
  return;
};
