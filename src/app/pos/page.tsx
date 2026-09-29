import AppLayout from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PosClient from "@/components/pos/PosClient";

export default async function PosPage() {
  const user = await getCurrentUser();

  const [products, categories, storeSettings, customers] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    prisma.storeSettings.findFirst(),
    prisma.customer.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        totalDebt: true,
      },
    }),
  ]);

  return (
    <AppLayout>
      <PosClient
        products={products}
        categories={categories}
        storeSettings={storeSettings}
        customers={customers}
        cashierName={user?.name || "Kasir Toko"}
      />
    </AppLayout>
  );
}
