import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginPage from "./login/page";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  redirect("/pos");
}
