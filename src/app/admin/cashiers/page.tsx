import AppLayout from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CashierListClient from "@/components/cashiers/CashierListClient";

export default async function AdminCashiersPage() {
  const currentUser = await getCurrentUser();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  return (
    <AppLayout requiredRole="ADMIN">
      <CashierListClient
        initialUsers={users}
        currentUserId={currentUser?.id || ""}
      />
    </AppLayout>
  );
}
