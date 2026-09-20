"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface StockAdjustmentPayload {
  productId: string;
  type: "ADD" | "REMOVE";
  quantity: number;
  reason: "Restock" | "Damaged" | "Lost" | "Correction" | "Other";
  notes?: string;
}

export async function adjustStock(payload: StockAdjustmentPayload) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Hanya Pemilik/Admin yang berhak melakukan penyesuaian stok." };
  }

  const { productId, type, quantity, reason, notes } = payload;

  if (!productId) {
    return { success: false, message: "Produk wajib dipilih." };
  }

  if (quantity <= 0) {
    return { success: false, message: "Jumlah penyesuaian harus lebih besar dari 0." };
  }

  try {
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error("Produk tidak ditemukan.");
        }

        const stockBefore = product.stock;
        let stockAfter = stockBefore;
        let movementType = "";

        if (type === "ADD") {
          stockAfter = stockBefore + quantity;
          movementType = reason === "Restock" ? "RESTOCK" : "ADJUSTMENT_ADD";
        } else {
          if (stockBefore < quantity) {
            throw new Error(
              `Pengurangan gagal: Stok fisik saat ini (${stockBefore}) lebih kecil dari jumlah yang ingin dikurangi (${quantity}).`
            );
          }
          stockAfter = stockBefore - quantity;
          movementType = "ADJUSTMENT_REMOVE";
        }

        // Update product stock
        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: { stock: stockAfter },
        });

        // Record in StockMovement
        const reasonLabel = notes ? `${reason}: ${notes}` : reason;
        const movement = await tx.stockMovement.create({
          data: {
            productId,
            userId: user.id,
            type: movementType,
            quantity: type === "ADD" ? quantity : -quantity,
            stockBefore,
            stockAfter,
            referenceType: "MANUAL_ADJUSTMENT",
            reason: reasonLabel,
          },
        });

        return { updatedProduct, movement };
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/admin/dashboard");
    revalidatePath("/pos");

    return {
      success: true,
      message: `Penyesuaian stok berhasil! Stok "${result.updatedProduct.name}" kini menjadi ${result.updatedProduct.stock} unit.`,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal melakukan penyesuaian stok.";
    return {
      success: false,
      message: msg,
    };
  }
}
