import AppLayout from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDebtOverview, getCustomers } from "@/app/actions/customers";
import { prisma } from "@/lib/prisma";
import DebtClient from "@/components/debts/DebtClient";

export default async function AdminDebtsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/pos");
  }

  const [{ debtors, debtTransactions, recentPayments, stats }, allCustomers, storeSettings] =
    await Promise.all([
      getDebtOverview(),
      getCustomers(),
      prisma.storeSettings.findFirst(),
    ]);

  return (
    <AppLayout>
      <DebtClient
        initialDebtors={debtors as any}
        initialDebtTransactions={debtTransactions as any}
        initialRecentPayments={recentPayments as any}
        initialAllCustomers={allCustomers as any}
        stats={stats}
        storeSettings={storeSettings}
        isAdmin={true}
      />
    </AppLayout>
  );
}
