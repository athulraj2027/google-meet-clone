import { Rooms } from "./room.store";

export const getRtpCapabilities = async (roomId: string) => {
  const router = Rooms.get(roomId)?.router;
  return router?.rtpCapabilities;
};
