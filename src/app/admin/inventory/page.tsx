import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import InventoryClient from "@/components/inventory/InventoryClient";

export default async function AdminInventoryPage() {
  const [products, categories, movements] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.stockMovement.findMany({
      include: {
        product: {
          include: { category: true },
        },
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <AppLayout requiredRole="ADMIN">
      <InventoryClient
        products={products}
        categories={categories}
        movements={movements}
      />
    </AppLayout>
  );
}
