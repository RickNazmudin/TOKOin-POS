"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
  paymentMethod: "CASH" | "QRIS" | "DEBT";
  paidAmount: number;
  customerId?: string | null;
  newCustomerName?: string | null;
  newCustomerPhone?: string | null;
  notes?: string | null;
}

export async function processPosTransaction(payload: CheckoutPayload) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Sesi kasir telah berakhir. Silakan login kembali." };
  }

  const {
    items,
    discount = 0,
    paymentMethod = "CASH",
    paidAmount = 0,
    customerId,
    newCustomerName,
    newCustomerPhone,
    notes,
  } = payload;

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

  // Validation based on payment method
  if (paymentMethod === "CASH" && paidAmount < calculatedTotal) {
    return {
      success: false,
      message: `Uang pembayaran kurang Rp${(calculatedTotal - paidAmount).toLocaleString("id-ID")}`,
    };
  }

  if (paymentMethod === "DEBT" && !customerId && (!newCustomerName || newCustomerName.trim() === "")) {
    return {
      success: false,
      message: "Nama pelanggan wajib diisi atau dipilih untuk transaksi Hutang/Kasbon.",
    };
  }

  const safePaidAmount =
    paymentMethod === "QRIS"
      ? calculatedTotal
      : paymentMethod === "DEBT"
      ? Math.max(0, Math.min(paidAmount, calculatedTotal))
      : paidAmount;

  const calculatedChange = paymentMethod === "CASH" ? safePaidAmount - calculatedTotal : 0;
  const debtRemaining = paymentMethod === "DEBT" ? calculatedTotal - safePaidAmount : 0;

  const transactionStatus =
    paymentMethod === "DEBT"
      ? safePaidAmount === 0
        ? "UNPAID"
        : safePaidAmount >= calculatedTotal
        ? "COMPLETED"
        : "PARTIAL"
      : "COMPLETED";

  try {
    const result = await prisma.$transaction(
      async (tx: any) => {
        // 2. Resolve Customer if DEBT
        let resolvedCustomerId: string | null = customerId || null;
        let resolvedCustomerName: string | null = null;
        let currentCustomerTotalDebt = 0;

        if (paymentMethod === "DEBT") {
          if (customerId) {
            const existingCust = await tx.customer.findUnique({
              where: { id: customerId },
            });
            if (!existingCust) {
              throw new Error("Data pelanggan tidak ditemukan.");
            }
            resolvedCustomerId = existingCust.id;
            resolvedCustomerName = existingCust.name;
            currentCustomerTotalDebt = existingCust.totalDebt;
          } else if (newCustomerName && newCustomerName.trim() !== "") {
            const createdCust = await tx.customer.create({
              data: {
                name: newCustomerName.trim(),
                phone: newCustomerPhone?.trim() || null,
              },
            });
            resolvedCustomerId = createdCust.id;
            resolvedCustomerName = createdCust.name;
            currentCustomerTotalDebt = 0;
          }
        }

        // 3. Validate real-time stock for all products in a single query
        const productIds = items.map((i) => i.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds } },
        });
        const productMap = new Map<string, any>(
          products.map((p: any) => [p.id, p])
        );

        for (const item of items) {
          const prod = productMap.get(item.productId);

          if (!prod || prod.status !== "ACTIVE") {
            throw new Error(`Produk "${item.name}" tidak ditemukan atau sudah dinonaktifkan.`);
          }

          if (prod.stock < item.quantity) {
            throw new Error(
              `Stok "${prod.name}" tidak mencukupi! Sisa stok tersedia: ${prod.stock}, diminta: ${item.quantity}`
            );
          }
        }

        // 4. Generate Sequential Invoice Number (INV-YYYYMMDD-XXXX)
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

        let sequence = countToday + 1;
        let invoiceNumber = `${datePrefix}-${String(sequence).padStart(4, "0")}`;

        let existingInvoice = await tx.transaction.findUnique({
          where: { invoiceNumber },
          select: { id: true },
        });
        while (existingInvoice) {
          sequence += 1;
          invoiceNumber = `${datePrefix}-${String(sequence).padStart(4, "0")}`;
          existingInvoice = await tx.transaction.findUnique({
            where: { invoiceNumber },
            select: { id: true },
          });
        }

        // 5. Create Transaction Record
        const transaction = await tx.transaction.create({
          data: {
            invoiceNumber,
            cashierId: user.id,
            customerId: resolvedCustomerId,
            customerName: resolvedCustomerName,
            subtotal: calculatedSubtotal,
            discount: safeDiscount,
            total: calculatedTotal,
            paymentMethod,
            paidAmount: safePaidAmount,
            changeAmount: calculatedChange,
            debtRemaining,
            status: transactionStatus,
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
            customer: true,
            items: true,
          },
        });

        // 6. Update Customer Total Debt & Record DP if applicable
        let updatedCustomerDebt = currentCustomerTotalDebt;
        if (paymentMethod === "DEBT" && resolvedCustomerId) {
          updatedCustomerDebt = currentCustomerTotalDebt + debtRemaining;
          await tx.customer.update({
            where: { id: resolvedCustomerId },
            data: { totalDebt: updatedCustomerDebt },
          });

          // If Down Payment (DP) paid at POS
          if (safePaidAmount > 0) {
            await tx.debtPayment.create({
              data: {
                customerId: resolvedCustomerId,
                transactionId: transaction.id,
                cashierId: user.id,
                amount: safePaidAmount,
                paymentMethod: "CASH",
                notes: "Uang Muka (DP) saat transaksi kasir",
              },
            });
          }
        }

        // 7. Deduct Product Stocks & Record Stock Movements
        for (const item of items) {
          const prod = productMap.get(item.productId)!;
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
              quantity: item.quantity,
              stockBefore: prod.stock,
              stockAfter: newStock,
              referenceType: "TRANSACTION",
              referenceId: transaction.id,
              reason: `Penjualan Kasir POS #${transaction.invoiceNumber}`,
            },
          });
        }

        // 8. Fetch Store Settings for the receipt
        const storeSettings = await tx.storeSettings.findUnique({
          where: { id: "default_store" },
        });

        return {
          transaction: {
            ...transaction,
            totalCustomerDebt: updatedCustomerDebt,
          },
          storeSettings,
        };
      },
      {
        timeout: 10000,
      }
    );

    revalidatePath("/pos");
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/transactions");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/debts");
    revalidatePath("/cashier/debts");

    return {
      success: true,
      transaction: result.transaction,
      storeSettings: result.storeSettings,
      message: "Transaksi berhasil diproses!",
    };
  } catch (error: any) {
    console.error("Error processing POS transaction:", error);
    return {
      success: false,
      message: error.message || "Gagal memproses transaksi kasir.",
    };
  }
}
