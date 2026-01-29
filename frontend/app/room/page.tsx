import { connection } from "next/server";
import { RoomPage } from "@/components/RoomPage";

export default async function Page() {
  await connection();
  return <RoomPage />;
}
