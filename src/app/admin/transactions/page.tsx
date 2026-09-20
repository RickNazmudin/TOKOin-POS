import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import TransactionListClient from "@/components/transactions/TransactionListClient";

export default async function AdminTransactionsPage() {
  const [transactions, storeSettings] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        cashier: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.storeSettings.findFirst(),
  ]);

  return (
    <AppLayout requiredRole="ADMIN">
      <TransactionListClient
        initialTransactions={transactions}
        storeSettings={storeSettings}
        isAdmin={true}
      />
    </AppLayout>
  );
}
