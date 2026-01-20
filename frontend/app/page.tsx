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
      ({ success, token }: { success: boolean; token: string }) => {
        if (!success) {
          toast.error("Failed to create room");
          return;
        }
        router.push(`/room?roomId=${roomId}&token=${token}`);
      },
    );
  };
  return (
    <div>
      <p>Status: {isConnected ? "connected" : "disconnected"}</p>
      <p>Transport: {transport}</p>
      <Button onClick={createRoom}>Create New Room</Button>
    </div>
  );
}
