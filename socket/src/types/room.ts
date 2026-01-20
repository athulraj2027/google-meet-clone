import { Consumer, Producer, Router, Transport } from "mediasoup/types";

export interface User {
  socketId: string;
  peerId: string;

  transports: Map<string, Transport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

export interface RoomInterface {
  router: Router;
  hostPeerId: string;
  peers: Map<string, User>;
  token: string;
}
