"use client";

import * as mediasoupClient from "mediasoup-client";
import { socket } from "@/lib/socket";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Producer, Transport, TransportOptions } from "mediasoup-client/types";

export default function RoomPage() {
  const params = useSearchParams();
  const roomId = params.get("roomId");
  const initialized = useRef(false);
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<Transport>(undefined);
  const recvTransportRef = useRef<Transport>(undefined);

  const audioProducerRef = useRef<Producer>(undefined);
  const videoProducerRef = useRef<Producer>(undefined);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream>(null);

  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);

  const startVideo = async () => {
    try {
      // If producer exists but paused → create NEW track
      const peerId = localStorage.getItem("peerId");
      if (videoProducerRef.current) {
        const mediastream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        localStreamRef.current = mediastream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediastream;
        }

        const newTrack = mediastream.getVideoTracks()[0];

        await videoProducerRef.current.replaceTrack({
          track: newTrack,
        });

        videoProducerRef.current.resume();
        setVideo(true);
        socket.emit("resume-produce", { kind: "video", peerId, roomId });
        return;
      }

      // First time
      const mediastream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      localStreamRef.current = mediastream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediastream;
      }

      const track = mediastream.getVideoTracks()[0];

      videoProducerRef.current = await sendTransportRef.current?.produce({
        track,
      });

      setVideo(true);
    } catch (error) {
      console.log("Error starting video:", error);
      toast.error("Camera permission required");
    }
  };

  const stopVideo = async () => {
    try {
      const peerId = localStorage.getItem("peerId");
      // 1. Pause producer (stop sending)
      videoProducerRef.current?.pause();

      // 2. Stop camera hardware
      const track = localStreamRef.current?.getVideoTracks()[0];
      track?.stop();

      // 3. Remove from video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      socket.emit("pause-produce", { kind: "video", peerId, roomId });

      setVideo(false);
    } catch (error) {
      console.log("Error in stopping video : ", error);
      toast.error("Failed to turn off camera.");
    }
  };

  const startMic = async () => {
    try {
      const peerId = localStorage.getItem("peerId");
      // If producer exists → create NEW track
      if (audioProducerRef.current) {
        const mediastream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        localStreamRef.current = mediastream;

        const newTrack = mediastream.getAudioTracks()[0];

        await audioProducerRef.current.replaceTrack({
          track: newTrack,
        });

        audioProducerRef.current.resume();
        setMic(true);
        return;
      }

      // First time
      const mediastream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      localStreamRef.current = mediastream;

      const track = mediastream.getAudioTracks()[0];

      audioProducerRef.current = await sendTransportRef.current?.produce({
        track,
      });

      setMic(true);
      socket.emit("resume-produce", { kind: "audio", peerId, roomId });
    } catch (error) {
      console.log("Error starting mic:", error);
      toast.error("Mic permission required");
    }
  };

  const stopMic = async () => {
    try {
      const peerId = localStorage.getItem("peerId");
      // Stop sending
      audioProducerRef.current?.pause();

      // Turn OFF mic hardware
      const track = localStreamRef.current?.getAudioTracks()[0];
      track?.stop();

      setMic(false);
      socket.emit("pause-produce", { kind: "audio", peerId, roomId });
    } catch (error) {
      console.log("Error muting mic:", error);
      toast.error("Failed to mute mic");
    }
  };

  const leaveRoom = async () => {};

  useEffect(() => {
    socket.on("producer-paused", async ({ kind, peerId }) => {});
    socket.on("producer-resumed", async ({ kind, peerId }) => {});
    socket.on("user-left-room", async ({ peerId }) => {});

    return () => {
      socket.off("producer-paused");
      socket.off("producer-resumed");
      socket.off("user-left-room");
    };
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let peerId = localStorage.getItem("peerId") as string;
    if (!peerId) {
      peerId = crypto.randomUUID();
      localStorage.setItem("peerId", peerId);
    }
    // initializing transport, device,
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
          async ({
            success,
            rtpCapabilities,
          }: {
            success: boolean;
            rtpCapabilities: mediasoupClient.types.RtpCapabilities;
          }) => {
            if (!success) return;
            const device = new mediasoupClient.Device();

            console.log("New device created  :", device);
            await device.load({ routerRtpCapabilities: rtpCapabilities });
            deviceRef.current = device;
            console.log("is device loaded  :", device.loaded);

            socket.emit(
              "create-transport",
              { direction: "send", roomId, peerId },
              async (params: TransportOptions) => {
                console.log("Transport params received for send : ", params);
                const sendTransport = device.createSendTransport(params);

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
                        (response: { success: boolean }) => {
                          console.log(
                            "✅ Server response after connecting :",
                            response,
                          );

                          if (response?.success) {
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

                sendTransport?.on("produce", ({ kind, rtpParameters }, cb) => {
                  console.log("produce event fired");
                  socket.emit(
                    "produce",
                    {
                      roomId,
                      transportId: sendTransport.id,
                      kind,
                      rtpParameters,
                      peerId,
                    },
                    ({ id }: { id: string }) => cb({ id }),
                  );
                });
                sendTransportRef.current = sendTransport;
              },
            );

            socket.emit(
              "create-transport",
              { direction: "recv", roomId, peerId },
              async (params: TransportOptions) => {
                console.log("Transport params received for recv : ", params);
                const recvTransport = device.createRecvTransport(params);
                recvTransport?.on(
                  "connect",
                  async ({ dtlsParameters }, callback, errback) => {
                    console.log(" Connect event fired - sending DTLS");
                    console.log("dtls received : ", dtlsParameters);

                    try {
                      socket.emit(
                        "connect-transport",
                        {
                          transportId: recvTransport.id,
                          dtlsParameters,
                          roomId,
                          peerId,
                        },
                        (response: { success: boolean }) => {
                          console.log(
                            "✅ Server response after connecting :",
                            response,
                          );
                          if (response?.success) {
                            callback();
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
                recvTransportRef.current = recvTransport;
                socket.emit(
                  "get-producers",
                  { roomId, peerId },
                  async (response: {
                    success: boolean;
                    producers: Map<string, string>;
                  }) => {
                    if (!response.success) return;
                  },
                );
              },
            );
          },
        );
      },
    );
  }, [roomId]);

  return (
    <div className="flex gap-7">
      <div className="relative">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted // IMPORTANT (avoid echo)
          className="w-60 rounded-lg"
        />
        <div className="absolute b-0">
          <p>You</p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={!mic ? startMic : stopMic}
          className="bg-blue-500 p-2 rounded-md"
        >
          {mic ? "Mute" : "Unmute"}
        </button>

        <button
          onClick={!video ? startVideo : stopVideo}
          className="bg-blue-500 p-2 rounded-md"
        >
          Video {video ? "Off" : "On"}
        </button>
        <button onClick={leaveRoom} className="bg-red-500 p-2 rounded-md">
          Leave Room
        </button>
      </div>
    </div>
  );
}
