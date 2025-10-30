"use server";
import { getUserById } from "@/app/(auth)/login/actions";
import { verifySession } from "@/lib/session";

export const getCurrentUser = async () => {
  const sessionUser = await verifySession();
  if (!sessionUser) {
    return null;
  }
  const aUser = await getUserById(sessionUser.user_id || "");
  return aUser;
};
