"use client";

import * as mediasoupClient from "mediasoup-client";
import { socket } from "@/lib/socket";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  AppData,
  Consumer,
  Producer,
  RtpParameters,
  Transport,
  TransportOptions,
} from "mediasoup-client/types";
import { Button } from "@/components/ui/button";

type Message = {
  message: string;
  peerId: string;
  time: Date;
};

export const RoomPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const roomId = params.get("roomId");
  const initialized = useRef(false);
  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<Transport>(undefined);
  const recvTransportRef = useRef<Transport>(undefined);

  const audioProducerRef = useRef<Producer>(undefined);
  const videoProducerRef = useRef<Producer>(undefined);
  const screenProducerRef = useRef<Producer>(undefined);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream>(null);
  const localScreenStreamRef = useRef<MediaStream>(null);

  const consumerRef = useRef<Consumer[]>([]);
  const [startedConsuming, setStartedConsuming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [mic, setMic] = useState(false);
  const [video, setVideo] = useState(false);
  const [screen, setScreen] = useState(false);

  const resetMediasoupRefs = () => {
    deviceRef.current = null;

    sendTransportRef.current?.close();
    recvTransportRef.current?.close();

    sendTransportRef.current = undefined;
    recvTransportRef.current = undefined;

    videoProducerRef.current?.close();
    audioProducerRef.current?.close();

    videoProducerRef.current = undefined;
    audioProducerRef.current = undefined;

    consumerRef.current.forEach((c) => c.close());
    consumerRef.current = [];
    initialized.current = false;
    localStorage.removeItem("peerId");
  };

  const startVideo = async () => {
    try {
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

        return;
      }
      const mediastream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      localStreamRef.current = mediastream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediastream;
      }
      const track = mediastream.getVideoTracks()[0];
      const videoProducer = await sendTransportRef.current?.produce({
        track,
      });

      videoProducer?.observer.on("pause", () => {
        console.log("pausing producer...");
        console.log("video producer : ", videoProducer);
        socket.emit(
          "pause-produce",
          {
            kind: "video",
            producerId: videoProducer.id,
            roomId,
            peerId,
          },
          ({ success }: { success: boolean; producerId: string }) => {
            console.log("pause : ", success);
          },
        );
      });

      videoProducer?.observer.on("resume", () => {
        console.log("resuming producer ...");
        socket.emit("resume-produce", {
          kind: "video",
          producerId: videoProducer.id,
          peerId,
          roomId,
        });
      });

      videoProducer?.observer.on("close", () => {});

      videoProducerRef.current = videoProducer;
      setVideo(true);
    } catch (error) {
      console.log("Error starting video:", error);
      toast.error("Camera permission required");
    }
  };

  const stopVideo = async () => {
    try {
      videoProducerRef.current?.pause();
      const track = localStreamRef.current?.getVideoTracks()[0];
      track?.stop();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      setVideo(false);
    } catch (error) {
      console.log("Error in stopping video : ", error);
      toast.error("Failed to turn off camera.");
    }
  };

  const startMic = async () => {
    try {
      const peerId = localStorage.getItem("peerId");
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
      const mediastream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      localStreamRef.current = mediastream;
      const track = mediastream.getAudioTracks()[0];
      const audioProducer = await sendTransportRef.current?.produce({
        track,
      });

      audioProducer?.observer.on("pause", () => {
        socket.emit(
          "pause-produce",
          {
            kind: "audio",
            producerId: audioProducer.id,
            roomId,
            peerId,
          },
          ({ success }: { success: boolean; producerId: string }) => {
            console.log("pause : ", success);
          },
        );
      });

      audioProducer?.observer.on("resume", () => {
        socket.emit("resume-produce", {
          kind: "audio",
          producerId: audioProducer.id,
          peerId,
          roomId,
        });
      });

      audioProducer?.observer.on("close", () => {});
      audioProducerRef.current = audioProducer;
      setMic(true);
    } catch (error) {
      console.log("Error starting mic:", error);
      toast.error("Mic permission required");
    }
  };

  const stopMic = async () => {
    try {
      audioProducerRef.current?.pause();
      const track = localStreamRef.current?.getAudioTracks()[0];
      track?.stop();
      setMic(false);
    } catch (error) {
      console.log("Error muting mic:", error);
      toast.error("Failed to mute mic");
    }
  };

  const startScreenShare = async () => {
    try {
      const peerId = localStorage.getItem("peerId");
      const mediastream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      localScreenStreamRef.current = mediastream;
      if (localScreenRef.current) {
        localScreenRef.current.srcObject = mediastream;
      }
      const track = mediastream.getVideoTracks()[0];
      track.onended = () => {
        console.log("Screen share ended by browser");

        screenProducerRef.current?.close();
        screenProducerRef.current = undefined;
        setScreen(false);
      };
      const screenProducer = await sendTransportRef.current?.produce({
        track,
        appData: { mediaTag: "screen" },
      });

      if (!screenProducer) {
        toast.error("Failed to share screen");
        return;
      }

      screenProducer.observer.on("close", () => {
        socket.emit(
          "stop-screen-share",
          { producerId: screenProducer.id, peerId, roomId },
          () => {},
        );
      });

      screenProducerRef.current = screenProducer;
      setScreen(true);
    } catch (error) {
      console.log("Error starting screenshare:", error);
      toast.error("Screen permission required");
    }
  };

  const stopScreenShare = async () => {
    try {
      screenProducerRef.current?.close();
      const track = localScreenStreamRef.current?.getVideoTracks()[0];
      track?.stop();
      setScreen(false);
    } catch (error) {
      console.log("Error stopping screenshare:", error);
      toast.error("Failed to stop screenshare");
    }
  };

  const leaveRoom = async () => {
    const peerId = localStorage.getItem("peerId");

    socket.emit("leave-room", { peerId, roomId }, async () => {
      videoProducerRef.current?.close();
      audioProducerRef.current?.close();
      screenProducerRef.current?.close();
      consumerRef.current?.forEach((consumer) => consumer.close());
      consumerRef.current = [];
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localScreenStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      if (localScreenRef.current) {
        localScreenRef.current.srcObject = null;
      }
      initialized.current = false;
      localStorage.removeItem("peerId");
      toast.success("You left the room");
      router.push("/");
    });
  };

  const attachVideo = async (
    stream: MediaStream,
    consumer: Consumer,
    producerPeerId: string,
  ) => {
    console.log("consumer attatching : ", consumer);
    const isScreenShare = consumer.appData.mediaTag === "screen";
    const wrapper = document.createElement("div");
    wrapper.className = isScreenShare
      ? "relative col-span-full row-span-2 w-full rounded-lg overflow-hidden bg-black" // Screen takes full width
      : "relative w-full rounded-lg overflow-hidden bg-black";

    wrapper.dataset.consumerId = consumer.id;
    wrapper.dataset.mediaTag = consumer.appData.mediaTag as string;

    // Video element
    const video = document.createElement("video");
    // After creating the video element in attachVideo:
    if (isScreenShare) {
      const screenIndicator = document.createElement("div");
      screenIndicator.className =
        "absolute top-3 left-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2";
      screenIndicator.innerHTML = `
    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
    </svg>
    <span>Screen Share</span>
  `;
      wrapper.appendChild(screenIndicator);
    }
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.className = isScreenShare
      ? "w-full h-full object-contain min-h-[500px]" // Screen: contain to preserve aspect ratio
      : "w-full h-70 object-cover"; // Camera: cover to fill space
    wrapper.appendChild(video);

    // Overlay for paused/Camera off
    const overlay = document.createElement("div");
    overlay.className =
      "absolute inset-0 bg-black flex items-center justify-center text-white text-sm hidden";
    overlay.innerText = "Camera Off";
    overlay.dataset.overlay = "true";
    wrapper.appendChild(overlay);

    // Peer ID label at bottom
    const label = document.createElement("div");
    label.className =
      "absolute bottom-0 left-0 w-full bg-black text-white text-xs py-1 px-2 text-center";
    label.innerText = producerPeerId;
    wrapper.appendChild(label);

    // Append to remote videos container
    document.getElementById("remote-videos")?.appendChild(wrapper);
  };

  const attachAudio = (stream: MediaStream) => {
    const audio = document.createElement("audio");
    audio.srcObject = stream;
    audio.autoplay = true;
  };

  const consumeProducer = useCallback(
    async (producer: {
      producerId: string;
      peerId: string;
      kind: "audio" | "video";
      appData: AppData;
      paused: boolean;
    }) => {
      console.log("appdata : ", producer.appData);
      const peerId = localStorage.getItem("peerId");
      if (!recvTransportRef.current || !deviceRef.current) {
        console.error("Recv transport not ready yet");
        return;
      }
      socket.emit(
        "consume",
        {
          roomId,
          producer,
          consumerPeerId: peerId,
          rtpCapabilities: deviceRef.current?.rtpCapabilities,
          transportId: recvTransportRef.current?.id,
        },
        async ({
          success,
          params,
        }: {
          success: boolean;
          params: {
            id: string;
            producerId: string;
            kind: "audio" | "video";
            appData: AppData;
            rtpParameters: RtpParameters;
            producerPeerId: string;
          };
        }) => {
          console.log("params received from the consume event : ", params); // it is now undefined
          if (!success) {
            console.log("Consumption cb error");
            toast.error("Failed to consume from server");
            return;
          }
          const {
            id,
            producerId,
            kind,
            rtpParameters,
            producerPeerId,
            appData,
          } = params;
          const consumer = await recvTransportRef.current?.consume({
            id,
            producerId,
            kind,
            appData,
            rtpParameters,
          });
          if (!consumer) {
            console.log("Failed to create frontend consumer");
            return;
          }

          consumer.on("@pause", () => {
            console.log("paused");
            if (consumer.kind === "video") {
              const wrapper = document.querySelector(
                `div[data-consumer-id="${consumer.id}"]`,
              ) as HTMLDivElement | null;

              if (!wrapper) return;

              const overlay = wrapper.querySelector(
                `div[data-overlay="true"]`,
              ) as HTMLDivElement | null;

              if (overlay) {
                overlay.style.display = "flex"; // BLACK SCREEN
              }
            }
          });

          consumer.observer.on("resume", () => {
            console.log("resumed");
            if (consumer.kind === "video") {
              const wrapper = document.querySelector(
                `div[data-consumer-id="${consumer.id}"]`,
              ) as HTMLDivElement | null;

              if (!wrapper) return;

              const overlay = wrapper.querySelector(
                `div[data-overlay="true"]`,
              ) as HTMLDivElement | null;

              if (overlay) {
                overlay.style.display = "none"; // VIDEO BACK
              }
            }
          });

          consumer.observer.on("close", () => {
            if (consumer.kind === "video") {
              console.log("removing the video element");
              const wrapper = document.querySelector(
                `div[data-consumer-id="${consumer.id}"]`,
              );
              wrapper?.remove();
            }
          });

          consumerRef.current?.push(consumer);
          socket.emit("resume-consumer", {
            roomId,
            peerId,
            consumerId: consumer.id,
          });

          console.log("consumerRef : ", consumerRef.current);
          // now time to consume the data
          const stream = new MediaStream();
          stream.addTrack(consumer.track);
          if (consumer.kind === "video") {
            attachVideo(stream, consumer, producerPeerId);
          } else if (consumer.kind === "audio") {
            attachAudio(stream);
          }
        },
      );
    },
    [roomId],
  );

  const startGettingMedia = async () => {
    const peerId = localStorage.getItem("peerId");
    socket.emit(
      "get-producers",
      { roomId, peerId },
      async (response: {
        success: boolean;
        producers: {
          producerId: string;
          peerId: string;
          appData: AppData;
          kind: "audio" | "video";
          paused: boolean;
        }[];
      }) => {
        console.log("Get producers given : ", response);
        if (!response.success) return;

        response.producers.forEach(async (producer) => {
          console.log("producer for the call : ", producer);
          await consumeProducer(producer);
        });
      },
    );
    setStartedConsuming(true);
  };

  const sendMessage = async () => {
    const peerId = localStorage.getItem("peerId");
    if (message.trim().length === 0) return;
    socket.emit("send-message", { peerId, roomId, message }, () => {
      setMessages((prev) => [
        ...prev,
        { peerId: "You", message, time: new Date() },
      ]);
      setMessage("");
    });
  };

  useEffect(() => {
    socket.on("producerpaused", ({ producerId }) => {
      consumerRef.current.forEach((consumer) => {
        if (consumer.producerId === producerId) {
          console.log("Found matching consumer → show overlay");
          consumer.pause();
        }
      });
    });
    socket.on("producerresumed", ({ producerId }) => {
      consumerRef.current.forEach((consumer) => {
        if (consumer.producerId === producerId) {
          console.log("Found matching consumer → show overlay");
          consumer.resume();
        }
      });
    });

    socket.on("producerclosed", ({ producerId }) => {
      consumerRef.current = consumerRef.current.filter((consumer) => {
        if (consumer.producerId === producerId) {
          if (consumer.kind === "video") {
            const wrapper = document.querySelector(
              `div[data-consumer-id="${consumer.id}"]`,
            );
            wrapper?.remove();
          }

          consumer.close();
          return false; // remove from ref
        }
        return true;
      });
    });
    socket.on("user-left-room", async ({ peerId }) => {
      toast.warning(`User ${peerId} left the room`);
    });
    socket.on("new-user", async ({ peerId }) => {
      toast.success(`New user (${peerId}) joined this room`);
    });
    socket.on("new-producer", async ({ producer }) => {
      consumeProducer(producer);
    });

    socket.on(
      "message-received",
      async ({ peerId, message }: { peerId: string; message: string }) => {
        console.log("message : ", message);
        setMessages((prev) => [...prev, { message, peerId, time: new Date() }]);
      },
    );

    return () => {
      socket.off("user-left-room");
      socket.off("new-user");
      socket.off("new-producer");
      socket.off("producerclosed");
      socket.off("producerresumed");
      socket.off("producerpaused");
      socket.off("message-received");
    };
  }, [consumeProducer]);

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
                            "Server response after connecting :",
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
                      console.error(" Connect error:", error);
                      errback(error as Error);
                    }
                  },
                );

                sendTransport?.on(
                  "produce",
                  ({ kind, rtpParameters, appData }, cb) => {
                    console.log("produce event fired");
                    socket.emit(
                      "produce",
                      {
                        roomId,
                        transportId: sendTransport.id,
                        kind,
                        rtpParameters,
                        peerId,
                        appData,
                      },
                      ({ id }: { id: string }) => cb({ id }),
                    );
                  },
                );
                sendTransportRef.current = sendTransport;
              },
            );

            socket.emit(
              "create-transport",
              { direction: "recv", roomId, peerId },
              async (params: TransportOptions) => {
                console.log("Transport params received for recv : ", params);
                const recvTransport = device.createRecvTransport(params);
                setLoading(false);
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
                            " Server response after connecting :",
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
                      console.error(" Connect error:", error);
                      errback(error as Error);
                    }
                  },
                );
                recvTransportRef.current = recvTransport;
                console.log(
                  "recvTransportId && recvTransportrefId",
                  recvTransport.id,
                  recvTransportRef.current.id,
                );
              },
            );
          },
        );
      },
    );
  }, [roomId, consumeProducer]);

  useEffect(() => {
    const peerId = localStorage.getItem("peerId");

    const handleLeave = () => {
      if (!peerId || !roomId) return;

      socket.emit(
        "leave-room",
        {
          peerId,
          roomId,
        },
        () => {},
      );

      // hard cleanup (local only)
      resetMediasoupRefs();
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
      videoProducerRef.current?.close();
      audioProducerRef.current?.close();
      consumerRef.current?.forEach((consumer) => consumer.close());
    };

    window.addEventListener("beforeunload", handleLeave);
    window.addEventListener("pagehide", handleLeave); // iOS/Safari

    return () => {
      window.removeEventListener("beforeunload", handleLeave);
      window.removeEventListener("pagehide", handleLeave);
    };
  }, [roomId]);

  return (
    <div className="relative w-full h-screen overflow-y-scroll">
      {/* Header */}

      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className=" font-medium">Room Session</h1>
            <p className=" text-sm">Meeting in progress</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Connected</span>
          </div>
          <button className="text-gray-400 hover:text-white transition">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex min-h-141">
        {/* Main Video Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-linear-to-br from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none"></div>

          {/* Remote Videos Grid */}
          <div
            id="remote-videos"
            className="
    grid
    grid-cols-1
    sm:grid-cols-2
    lg:grid-cols-3
    xl:grid-cols-4
    gap-4
    w-full
    h-full
    p-6
    auto-rows-min
    items-start
  "
          >
            {/* Remote videos will be added here dynamically */}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-6 right-6 group">
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-64 aspect-video rounded-xl bg-gray-900 shadow-2xl border-2 border-white/10 object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-white text-xs font-medium">You</span>
                  </div>
                </div>
              </div>
              {!video && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-2xl font-bold">Y</span>
                    </div>
                    <p className="text-gray-400 text-sm">Camera Off</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add this below your existing local video */}
          {screen && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="flex items-center gap-3 px-6 py-3 rounded-xl
                    bg-black/70 backdrop-blur-md
                    text-white shadow-lg border border-white/10"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-sm font-medium tracking-wide">
                  You are sharing your screen
                </p>
              </div>
            </div>
          )}
        </div>
        {/* Chat Section */}
        <div className="w-80  border-l border-white/10 flex flex-col">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-white/10  font-medium">
            Live Chat
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm gap-3">
            <div className="space-y-2 ">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="text-sm border border-gray-600 rounded-md p-2"
                >
                  <span className="font-semibold">
                    {message.peerId.slice(0, 6)}:
                  </span>{" "}
                  {message.message}
                  <br />
                  <p className="text-xs text-right">
                    {message.time.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <input
              placeholder="Type a message..."
              value={message}
              className="w-full px-3 py-2 rounded-lg bg-[#2a2a2d] text-white text-sm outline-none focus:ring-2 focus:ring-blue-600"
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button
              onClick={sendMessage}
              className="bg-black text-gray-400 w-full mt-2"
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-6 py-4 bg-[#1a1a1c] border-t border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left side - Meeting info */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>00:00:00</span>
          </div>

          {/* Center - Main controls */}
          <div className="flex items-center gap-3">
            {/* Microphone */}
            <button
              onClick={!mic ? startMic : stopMic}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                mic
                  ? "bg-[#3c4043] hover:bg-[#4f5256] text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              title={mic ? "Mute microphone" : "Unmute microphone"}
            >
              {mic ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>

            {/* Camera */}
            <button
              onClick={!video ? startVideo : stopVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                video
                  ? "bg-[#3c4043] hover:bg-[#4f5256] text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              title={video ? "Turn off camera" : "Turn on camera"}
            >
              {video ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>

            {/* Leave Call */}
            <button
              onClick={leaveRoom}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all hover:scale-110 text-white"
              title="Leave call"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
                />
              </svg>
            </button>

            {/* Screen Share */}
            <button
              aria-label={
                screen ? "Stop screen sharing" : "Start screen sharing"
              }
              title={screen ? "Stop presenting" : "Present screen"}
              onClick={screen ? stopScreenShare : startScreenShare}
              className={`
    w-14 h-14 rounded-full flex items-center justify-center
    transition-all duration-200
    text-white
    ${
      screen
        ? "bg-emerald-600 hover:bg-emerald-700 scale-110"
        : "bg-[#3c4043] hover:bg-[#4f5256] hover:scale-110"
    }
  `}
            >
              {screen ? (
                /* Stop Screen Share */
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                /* Start Screen Share */
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="14" rx="2" />
                  <path d="M8 20h8" />
                  <path d="M12 16v4" />
                </svg>
              )}
            </button>

            {/* More Options */}
            <button
              className="w-14 h-14 rounded-full bg-[#3c4043] hover:bg-[#4f5256] flex items-center justify-center transition-all hover:scale-110 text-white"
              title="More options"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>

          {/* Right side - Additional controls */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4f5256] flex items-center justify-center transition-all text-white">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button className="w-10 h-10 rounded-full bg-[#3c4043] hover:bg-[#4f5256] flex items-center justify-center transition-all text-white">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {!startedConsuming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-white text-xl font-semibold">
              Ready to join the call?
            </h2>

            <p className="text-white/70 text-sm max-w-sm">
              Click below to start receiving audio and video streams.
            </p>

            <button
              onClick={startGettingMedia}
              disabled={loading}
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 
                     disabled:bg-blue-400 disabled:cursor-not-allowed
                     text-white font-medium shadow-lg
                     transition-all hover:scale-105"
            >
              {loading
                ? "Initializing transports ..."
                : "Transports ready to consume"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
