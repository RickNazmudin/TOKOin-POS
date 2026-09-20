"use server";

import { loginAction, clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginServerAction(prevState: unknown, formData: FormData) {
  const result = await loginAction(formData);
  if (result.success && result.redirectUrl) {
    redirect(result.redirectUrl);
  }
  return result;
}

export async function logoutServerAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function getUserSession() {
  return await getCurrentUser();
}
