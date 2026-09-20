import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import StoreSettingsClient from "@/components/settings/StoreSettingsClient";

export default async function AdminSettingsPage() {
  const storeSettings = await prisma.storeSettings.findFirst();

  return (
    <AppLayout requiredRole="ADMIN">
      <StoreSettingsClient initialSettings={storeSettings} />
    </AppLayout>
  );
}
