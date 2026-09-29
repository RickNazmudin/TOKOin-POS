"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CustomerInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface DebtPaymentInput {
  customerId: string;
  transactionId?: string | null;
  amount: number;
  paymentMethod?: string;
  notes?: string | null;
}

/**
 * Get all active customers with search filter
 */
export async function getCustomers(query?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Sesi pengguna telah berakhir. Silakan login kembali.");
  }

  const where: any = {
    status: "ACTIVE",
  };

  if (query && query.trim() !== "") {
    where.OR = [
      { name: { contains: query.trim() } },
      { phone: { contains: query.trim() } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ totalDebt: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          transactions: true,
          debtPayments: true,
        },
      },
    },
  });

  return customers;
}

/**
 * Create a new customer
 */
export async function createCustomer(data: CustomerInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Sesi telah berakhir. Silakan login kembali." };
  }

  if (!data.name || data.name.trim() === "") {
    return { success: false, message: "Nama pelanggan wajib diisi." };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath("/admin/debts");
    revalidatePath("/cashier/debts");
    revalidatePath("/pos");

    return { success: true, customer, message: "Pelanggan baru berhasil ditambahkan!" };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return { success: false, message: error.message || "Gagal menyimpan data pelanggan." };
  }
}

/**
 * Update an existing customer
 */
export async function updateCustomer(id: string, data: CustomerInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Sesi telah berakhir. Silakan login kembali." };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath("/admin/debts");
    revalidatePath("/cashier/debts");
    revalidatePath("/pos");

    return { success: true, customer, message: "Data pelanggan berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal memperbarui data pelanggan." };
  }
}

/**
 * Delete a customer (soft delete status)
 */
export async function deleteCustomer(id: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Hanya pemilik/admin yang dapat menghapus pelanggan." };
  }

  try {
    const cust = await prisma.customer.findUnique({
      where: { id },
      select: { totalDebt: true },
    });

    if (cust && cust.totalDebt > 0) {
      return {
        success: false,
        message: `Pelanggan masih memiliki sisa hutang sebesar Rp${cust.totalDebt.toLocaleString(
          "id-ID"
        )}. Silakan lunasi terlebih dahulu.`,
      };
    }

    await prisma.customer.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    revalidatePath("/admin/debts");
    revalidatePath("/cashier/debts");
    revalidatePath("/pos");

    return { success: true, message: "Pelanggan berhasil dinonaktifkan." };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal menghapus data pelanggan." };
  }
}

/**
 * Get comprehensive debt overview (Debtors, Unpaid transactions, Recent payments)
 */
export async function getDebtOverview() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Sesi pengguna telah berakhir. Silakan login kembali.");
  }

  // 1. Debtors with active debt > 0
  const debtors = await prisma.customer.findMany({
    where: {
      status: "ACTIVE",
      totalDebt: { gt: 0 },
    },
    orderBy: { totalDebt: "desc" },
    include: {
      transactions: {
        where: {
          status: { in: ["UNPAID", "PARTIAL"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          cashier: { select: { name: true } },
        },
      },
    },
  });

  // 2. All debt transactions
  const debtTransactions = await prisma.transaction.findMany({
    where: {
      paymentMethod: "DEBT",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: true,
      cashier: { select: { name: true, username: true } },
      items: true,
      debtPayments: {
        include: {
          cashier: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // 3. Recent payment history
  const recentPayments = await prisma.debtPayment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: true,
      cashier: { select: { name: true, username: true } },
      transaction: { select: { invoiceNumber: true, total: true } },
    },
  });

  // 4. Summary Stats
  const totalOutstandingDebt = debtors.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalDebtorCount = debtors.length;
  const totalPaymentsReceived = recentPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    debtors,
    debtTransactions,
    recentPayments,
    stats: {
      totalOutstandingDebt,
      totalDebtorCount,
      totalPaymentsReceived,
    },
  };
}

/**
 * Record a debt payment / installment from a customer
 */
export async function recordDebtPayment(payload: DebtPaymentInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Sesi telah berakhir. Silakan login kembali." };
  }

  const { customerId, transactionId, amount, paymentMethod = "CASH", notes } = payload;

  if (!customerId) {
    return { success: false, message: "Pelanggan harus dipilih." };
  }

  if (!amount || amount <= 0) {
    return { success: false, message: "Nominal pembayaran harus lebih besar dari Rp 0." };
  }

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Get customer
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error("Data pelanggan tidak ditemukan.");
      }

      if (customer.totalDebt <= 0) {
        throw new Error("Pelanggan ini tidak memiliki sisa hutang yang tercatat.");
      }

      const actualPayment = Math.min(amount, customer.totalDebt);

      let remainingToAllocate = actualPayment;

      // 2. If a specific transaction is targeted first, reduce its debtRemaining
      if (transactionId) {
        const targetTx = await tx.transaction.findUnique({
          where: { id: transactionId },
        });

        if (targetTx && targetTx.debtRemaining > 0) {
          const alloc = Math.min(remainingToAllocate, targetTx.debtRemaining);
          const newRemaining = targetTx.debtRemaining - alloc;
          const newStatus = newRemaining === 0 ? "COMPLETED" : "PARTIAL";
          const newPaidAmount = targetTx.paidAmount + alloc;

          await tx.transaction.update({
            where: { id: transactionId },
            data: {
              debtRemaining: newRemaining,
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });

          remainingToAllocate -= alloc;
        }
      }

      // Automatically allocate any remaining payment to other oldest unpaid transactions of this customer
      if (remainingToAllocate > 0) {
        const unpaidTransactions = await tx.transaction.findMany({
          where: {
            customerId,
            id: transactionId ? { not: transactionId } : undefined,
            status: { in: ["UNPAID", "PARTIAL"] },
          },
          orderBy: { createdAt: "asc" },
        });

        for (const unpaidTx of unpaidTransactions) {
          if (remainingToAllocate <= 0) break;

          const alloc = Math.min(remainingToAllocate, unpaidTx.debtRemaining);
          const newRemaining = unpaidTx.debtRemaining - alloc;
          const newStatus = newRemaining === 0 ? "COMPLETED" : "PARTIAL";

          await tx.transaction.update({
            where: { id: unpaidTx.id },
            data: {
              debtRemaining: newRemaining,
              paidAmount: unpaidTx.paidAmount + alloc,
              status: newStatus,
            },
          });

          remainingToAllocate -= alloc;
        }
      }

      // 3. Update customer total debt
      const newCustomerTotalDebt = Math.max(0, customer.totalDebt - actualPayment);
      await tx.customer.update({
        where: { id: customerId },
        data: { totalDebt: newCustomerTotalDebt },
      });

      // 4. Create debt payment record
      const paymentRecord = await tx.debtPayment.create({
        data: {
          customerId,
          transactionId: transactionId || null,
          cashierId: user.id,
          amount: actualPayment,
          paymentMethod,
          notes: notes?.trim() || null,
        },
        include: {
          customer: true,
          cashier: { select: { name: true } },
        },
      });

      return {
        paymentRecord,
        remainingDebt: newCustomerTotalDebt,
      };
    });

    revalidatePath("/admin/debts");
    revalidatePath("/cashier/debts");
    revalidatePath("/admin/reports");
    revalidatePath("/admin/dashboard");
    revalidatePath("/pos");

    return {
      success: true,
      data: result,
      message: `Pembayaran hutang Rp${amount.toLocaleString(
        "id-ID"
      )} berhasil dicatat. Sisa hutang pelanggan: Rp${result.remainingDebt.toLocaleString("id-ID")}`,
    };
  } catch (error: any) {
    console.error("Error recording debt payment:", error);
    return { success: false, message: error.message || "Gagal mencatat pembayaran hutang." };
  }
}
