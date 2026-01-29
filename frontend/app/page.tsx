"use client";

import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();

  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const [peerId, setPeerId] = useState("");

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      let peerId = localStorage.getItem("peerId");

      if (!peerId) {
        peerId = crypto.randomUUID();
        localStorage.setItem("peerId", peerId);
      }
      setPeerId(peerId);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const createRoom = () => {
    const roomId = crypto.randomUUID(); // call the function
    console.log("peer id : ", peerId);
    socket.emit(
      "create-room",
      { user: { peerId }, roomId },
      ({ success }: { success: boolean; token: string }) => {
        if (!success) {
          toast.error("Failed to create room");
          return;
        }
        router.push(`/room?roomId=${roomId}`);
      },
    );
  };
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Live Connection Status
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Socket Status</span>
            <span
              className={`font-medium ${
                isConnected ? "text-green-600" : "text-red-600"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Transport</span>
            <span className="font-medium text-gray-800">
              {transport ? "Initialized" : "Not created"}
            </span>
          </div>
        </div>

        <Button onClick={createRoom} className="mt-6 w-full">
          Create New Room
        </Button>
      </div>
    </div>
  );
}
