"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export interface CartItemInput {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface CheckoutPayload {
  items: CartItemInput[];
  discount: number;
  paymentMethod: "CASH" | "QRIS";
  paidAmount: number;
}

export async function processPosTransaction(payload: CheckoutPayload) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Sesi kasir telah berakhir. Silakan login kembali." };
  }

  const { items, discount = 0, paymentMethod = "CASH", paidAmount = 0 } = payload;

  if (!items || items.length === 0) {
    return { success: false, message: "Keranjang belanja kosong." };
  }

  // 1. Calculate and validate amounts on the server
  let calculatedSubtotal = 0;
  for (const item of items) {
    if (item.quantity <= 0) {
      return { success: false, message: `Quantity untuk "${item.name}" tidak valid.` };
    }
    calculatedSubtotal += item.price * item.quantity;
  }

  const safeDiscount = Math.max(0, Math.min(discount, calculatedSubtotal));
  const calculatedTotal = calculatedSubtotal - safeDiscount;

  if (paymentMethod === "CASH" && paidAmount < calculatedTotal) {
    return {
      success: false,
      message: `Uang pembayaran kurang Rp${(calculatedTotal - paidAmount).toLocaleString("id-ID")}`,
    };
  }

  const calculatedChange = paymentMethod === "CASH" ? paidAmount - calculatedTotal : 0;

  try {
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 2. Validate real-time stock for each product
      for (const item of items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!prod || prod.status !== "ACTIVE") {
          throw new Error(`Produk "${item.name}" tidak ditemukan atau sudah dinonaktifkan.`);
        }

        if (prod.stock < item.quantity) {
          throw new Error(
            `Stok "${prod.name}" tidak mencukupi! Sisa stok tersedia: ${prod.stock}, diminta: ${item.quantity}`
          );
        }
      }

      // 3. Generate Sequential Invoice Number (INV-YYYYMMDD-XXXX)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const date = String(now.getDate()).padStart(2, "0");
      const datePrefix = `INV-${year}${month}${date}`;

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const countToday = await tx.transaction.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      const sequence = String(countToday + 1).padStart(4, "0");
      const invoiceNumber = `${datePrefix}-${sequence}`;

      // 4. Create Transaction Record
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          cashierId: user.id,
          subtotal: calculatedSubtotal,
          discount: safeDiscount,
          total: calculatedTotal,
          paymentMethod,
          paidAmount: paymentMethod === "QRIS" ? calculatedTotal : paidAmount,
          changeAmount: calculatedChange,
          status: "COMPLETED",
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              productName: i.name,
              price: i.price,
              quantity: i.quantity,
              subtotal: i.price * i.quantity,
            })),
          },
        },
        include: {
          cashier: true,
          items: true,
        },
      });

      // 5. Deduct Product Stocks & Record Stock Movements
      for (const item of items) {
        const prod = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (prod) {
          const newStock = prod.stock - item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              userId: user.id,
              type: "SALE",
              quantity: -item.quantity,
              stockBefore: prod.stock,
              stockAfter: newStock,
              referenceType: "TRANSACTION",
              referenceId: transaction.id,
              reason: `Penjualan kasir via ${invoiceNumber}`,
            },
          });
        }
      }

      return transaction;
    });

    // Revalidate paths so dashboard and stock reflect immediate changes
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/transactions");
    revalidatePath("/cashier/dashboard");
    revalidatePath("/cashier/transactions");
    revalidatePath("/pos");

    const storeSettings = await prisma.storeSettings.findFirst();

    return {
      success: true,
      message: "Transaksi berhasil diselesaikan!",
      transaction: result,
      storeSettings,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat memproses transaksi.";
    return {
      success: false,
      message: msg,
    };
  }
}
