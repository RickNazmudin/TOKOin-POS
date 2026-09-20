import AppLayout from "@/components/layout/AppLayout";
import { prisma } from "@/lib/prisma";
import ProductListClient from "@/components/products/ProductListClient";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        _count: {
          select: { transactionItems: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    }),
  ]);

  return (
    <AppLayout requiredRole="ADMIN">
      <ProductListClient
        initialProducts={products}
        categories={categories}
      />
    </AppLayout>
  );
}
