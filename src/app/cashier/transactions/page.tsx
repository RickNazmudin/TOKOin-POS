import AppLayout from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransactionListClient from "@/components/transactions/TransactionListClient";

export default async function CashierTransactionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [transactions, storeSettings] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        cashierId: user.id,
      },
      include: {
        cashier: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.storeSettings.findFirst(),
  ]);

  return (
    <AppLayout>
      <TransactionListClient
        initialTransactions={transactions}
        storeSettings={storeSettings}
        isAdmin={false}
      />
    </AppLayout>
  );
}
