import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createWorker } from "./mediasoup/worker";
import {
  consumerSocket,
  producerSocket,
  roomSocket,
  transportSocket,
} from "./socket";

const PORT = process.env.PORT;

const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL as string],
  },
});

createWorker();

io.on("connection", async (socket) => {
  console.log("New user connected at : ", socket.id);

  roomSocket(socket);
  transportSocket(socket);
  producerSocket(socket);
  consumerSocket(socket);
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
