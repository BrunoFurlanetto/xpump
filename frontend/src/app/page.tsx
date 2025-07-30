import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  await verifySession();
  redirect("/panel");
}
