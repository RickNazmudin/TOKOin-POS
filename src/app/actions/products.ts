"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// 1. Get Products with Filter and Search
export async function getProducts(options?: {
  query?: string;
  categoryId?: string;
  status?: string;
}) {
  const { query, categoryId, status } = options || {};

  const where: Prisma.ProductWhereInput = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (categoryId && categoryId !== "ALL") {
    where.categoryId = categoryId;
  }

  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
    ];
  }

  return await prisma.product.findMany({
    where,
    include: {
      category: true,
      _count: {
        select: { transactionItems: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// 2. Create Product
export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Hanya Pemilik/Admin yang berhak menambah produk." };
  }

  const name = (formData.get("name") as string)?.trim();
  const categoryId = (formData.get("categoryId") as string)?.trim();
  const sku = (formData.get("sku") as string)?.trim() || null;
  const costPrice = parseFloat(formData.get("costPrice") as string) || 0;
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string) || 0;
  const stock = parseInt(formData.get("stock") as string, 10) || 0;
  const minimumStock = parseInt(formData.get("minimumStock") as string, 10) || 5;

  if (!name) {
    return { success: false, message: "Nama produk wajib diisi." };
  }

  if (!categoryId) {
    return { success: false, message: "Kategori produk wajib dipilih." };
  }

  if (sellingPrice <= 0) {
    return { success: false, message: "Harga jual harus lebih besar dari Rp0." };
  }

  if (costPrice < 0) {
    return { success: false, message: "Harga beli modal tidak boleh negatif." };
  }

  if (stock < 0) {
    return { success: false, message: "Stok awal tidak boleh kurang dari 0." };
  }

  if (sku) {
    const existingSku = await prisma.product.findFirst({
      where: { sku },
    });
    if (existingSku) {
      return { success: false, message: `Barcode / SKU "${sku}" sudah digunakan oleh produk lain.` };
    }
  }

  try {
    const product = await prisma.$transaction(
      async (tx) => {
        const newProd = await tx.product.create({
          data: {
            name,
            categoryId,
            sku,
            costPrice,
            sellingPrice,
            stock,
            minimumStock,
            status: "ACTIVE",
          },
        });

        if (stock > 0) {
          await tx.stockMovement.create({
            data: {
              productId: newProd.id,
              userId: user.id,
              type: "RESTOCK",
              quantity: stock,
              stockBefore: 0,
              stockAfter: stock,
              referenceType: "MANUAL_ADJUSTMENT",
              reason: "Stok awal pembuatan produk baru",
            },
          });
        }

        return newProd;
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/dashboard");
    revalidatePath("/pos");
    return { success: true, message: "Produk berhasil ditambahkan.", product };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menyimpan produk baru.";
    return { success: false, message: msg };
  }
}

// 3. Update Product
export async function updateProduct(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  const name = (formData.get("name") as string)?.trim();
  const categoryId = (formData.get("categoryId") as string)?.trim();
  const sku = (formData.get("sku") as string)?.trim() || null;
  const costPrice = parseFloat(formData.get("costPrice") as string) || 0;
  const sellingPrice = parseFloat(formData.get("sellingPrice") as string) || 0;
  const minimumStock = parseInt(formData.get("minimumStock") as string, 10) || 5;
  const status = formData.get("status") as string;

  if (!name) {
    return { success: false, message: "Nama produk wajib diisi." };
  }

  if (!categoryId) {
    return { success: false, message: "Kategori produk wajib dipilih." };
  }

  if (sellingPrice <= 0) {
    return { success: false, message: "Harga jual harus lebih besar dari Rp0." };
  }

  if (sku) {
    const existingSku = await prisma.product.findFirst({
      where: {
        sku,
        NOT: { id },
      },
    });
    if (existingSku) {
      return { success: false, message: `Barcode / SKU "${sku}" sudah digunakan oleh produk lain.` };
    }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name,
        categoryId,
        sku,
        costPrice,
        sellingPrice,
        minimumStock,
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/pos");
    return { success: true, message: "Data produk berhasil diperbarui." };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui produk.";
    return { success: false, message: msg };
  }
}

// 4. Toggle Product Status (Aktif / Nonaktif)
export async function toggleProductStatus(id: string, currentStatus: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  try {
    await prisma.product.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return {
      success: true,
      message: `Status produk berhasil diubah menjadi ${newStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`,
    };
  } catch {
    return { success: false, message: "Gagal mengubah status produk." };
  }
}

// 5. Delete Product (Soft delete if has history)
export async function deleteProduct(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  const txItemCount = await prisma.transactionItem.count({
    where: { productId: id },
  });

  if (txItemCount > 0) {
    // Soft delete / deactivate to preserve historical integrity
    await prisma.product.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return {
      success: true,
      message: `Produk telah digunakan dalam ${txItemCount} transaksi sebelumnya, sehingga dinonaktifkan (bukan dihapus permanen) demi menjaga keutuhan riwayat laporan keuangan.`,
    };
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/admin/products");
    revalidatePath("/pos");
    return { success: true, message: "Produk berhasil dihapus permanen." };
  } catch {
    return { success: false, message: "Gagal menghapus produk." };
  }
}
