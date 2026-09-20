import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "./Navbar";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";

interface AppLayoutProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "CASHIER";
}

export default async function AppLayout({
  children,
  requiredRole,
}: AppLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (requiredRole && requiredRole === "ADMIN" && user.role !== "ADMIN") {
    // If cashier tries to access admin-only area, redirect to POS
    redirect("/pos");
  }

  const storeSettings = await prisma.storeSettings.findFirst();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Navbar
        user={user}
        storeName={storeSettings?.storeName || "TOKOin Warung"}
      />
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto pb-16 md:pb-0">
        <AppSidebar user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
      <MobileNav user={user} />
    </div>
  );
}
