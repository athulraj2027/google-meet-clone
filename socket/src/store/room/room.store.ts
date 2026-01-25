import { RoomInterface, User } from "../../types/room";

export const Rooms = new Map<string, RoomInterface>();

export const SocketIdToPeer = new Map<
  string,
  { roomId: string; peerId: string }
>();
