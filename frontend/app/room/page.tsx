"use client";

import * as mediasoupClient from "mediasoup-client";
import { socket } from "@/lib/socket";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function RoomPage() {
  const params = useSearchParams();
  const roomId = params.get("roomId");

  const [peerId, setPeerId] = useState("");
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
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

            socket.emit("create-transport", { kind: "send" }, async () => {});
          },
        );
      },
    );
  }, [peerId, roomId]);

  return;
}
