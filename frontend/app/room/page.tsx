"use client";

import * as mediasoupClient from "mediasoup-client";
import { socket } from "@/lib/socket";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Transport, TransportOptions } from "mediasoup-client/types";

export default function RoomPage() {
  const params = useSearchParams();
  const roomId = params.get("roomId");

  const [peerId, setPeerId] = useState("");
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<Transport>(undefined);

  useEffect(() => {
    const peer = localStorage.getItem("peerId") as string;
    setPeerId(peer);
    socket.emit(
      "join-room",
      { roomId, user: { peerId } },
      async ({ success }: { success: boolean }) => {
        if (!success) {
          toast.error("Failed to join the room");
          return;
        }
        socket.emit(
          "get-rtpCapabilities",
          { roomId },
          async (rtpCapabilities: mediasoupClient.types.RtpCapabilities) => {
            if (!rtpCapabilities) return;
            const device = new mediasoupClient.Device();
            deviceRef.current = device;
            console.log("New device created  :", device);
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            console.log("is device loaded  :", device.loaded);

            socket.emit(
              "create-transport",
              { direction: "send", roomId },
              async (params: TransportOptions) => {
                console.log("Transport params received : ", params);
                const sendTransport =
                  deviceRef.current?.createSendTransport(params);

                sendTransport?.on(
                  "connect",
                  async ({ dtlsParameters }, callback, errback) => {
                    console.log(" Connect event fired - sending DTLS");
                    console.log("dtls received : ", dtlsParameters);

                    try {
                      socket.emit(
                        "connect-transport",
                        {
                          transportId: sendTransport.id,
                          dtlsParameters,
                          roomId,
                          peerId,
                        },
                        (response: any) => {
                          console.log(
                            "✅ Server response after connecting :",
                            response,
                          );

                          if (response?.connected) {
                            callback(); // Tell transport connection succeeded
                          } else {
                            const error = new Error("Connection failed");
                            errback(error);
                          }
                        },
                      );
                    } catch (error) {
                      console.error("❌ Connect error:", error);
                      errback(error as Error);
                    }
                  },
                );
                sendTransport?.on("produce", () => {});

                sendTransportRef.current = sendTransport;
              },
            );
          },
        );
      },
    );
  }, [peerId, roomId]);

  return;
}
