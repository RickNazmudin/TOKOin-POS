import AppLayout from "@/components/layout/AppLayout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PosClient from "@/components/pos/PosClient";

export default async function PosPage() {
  const user = await getCurrentUser();

  const [products, categories, storeSettings] = await Promise.all([
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
  ]);

  return (
    <AppLayout>
      <PosClient
        products={products}
        categories={categories}
        storeSettings={storeSettings}
        cashierName={user?.name || "Kasir Toko"}
      />
    </AppLayout>
  );
}
