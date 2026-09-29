"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export interface SalesReportFilter {
  period: "TODAY" | "YESTERDAY" | "7_DAYS" | "30_DAYS" | "ALL";
  paymentMethod?: "ALL" | "CASH" | "QRIS" | "DEBT";
}

export async function getSalesReportData(filter: SalesReportFilter) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Akses ditolak. Hanya Pemilik/Admin yang dapat melihat laporan keuangan.");
  }

  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (filter.period === "TODAY") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter.period === "YESTERDAY") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);
  } else if (filter.period === "7_DAYS") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filter.period === "30_DAYS") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const whereCondition: any = {
    status: { not: "CANCELLED" },
  };

  if (filter.paymentMethod && filter.paymentMethod !== "ALL") {
    whereCondition.paymentMethod = filter.paymentMethod;
  }

  if (startDate && endDate) {
    whereCondition.createdAt = { gte: startDate, lte: endDate };
  } else if (startDate) {
    whereCondition.createdAt = { gte: startDate };
  }

  // Debt payment filter condition for the same period
  const paymentWhereCondition: any = {};
  if (startDate && endDate) {
    paymentWhereCondition.createdAt = { gte: startDate, lte: endDate };
  } else if (startDate) {
    paymentWhereCondition.createdAt = { gte: startDate };
  }

  // Fetch transactions and debt payments concurrently
  const [transactions, debtPayments] = await Promise.all([
    prisma.transaction.findMany({
      where: whereCondition,
      include: {
        cashier: true,
        customer: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.debtPayment.findMany({
      where: paymentWhereCondition,
      include: {
        cashier: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Calculate Metrics
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDiscount = 0;
  let totalItemsSold = 0;

  let cashRevenue = 0;
  let qrisRevenue = 0;
  let debtSalesTotal = 0;
  let debtDownPaymentTotal = 0;
  let unpaidDebtInPeriod = 0;

  const productSalesMap: Record<
    string,
    { name: string; categoryName: string; quantity: number; revenue: number; profit: number }
  > = {};
  const cashierSalesMap: Record<
    string,
    { name: string; transactionCount: number; revenue: number }
  > = {};
  const dailyChartMap: Record<
    string,
    { date: string; revenue: number; count: number; profit: number; cashInflow: number }
  > = {};

  for (const tx of transactions) {
    totalRevenue += tx.total;
    totalDiscount += tx.discount;

    if (tx.paymentMethod === "CASH") {
      cashRevenue += tx.total;
    } else if (tx.paymentMethod === "QRIS") {
      qrisRevenue += tx.total;
    } else if (tx.paymentMethod === "DEBT") {
      debtSalesTotal += tx.total;
      debtDownPaymentTotal += tx.paidAmount;
      unpaidDebtInPeriod += tx.debtRemaining;
    }

    // Cashier breakdown
    if (!cashierSalesMap[tx.cashierId]) {
      cashierSalesMap[tx.cashierId] = {
        name: tx.cashier.name,
        transactionCount: 0,
        revenue: 0,
      };
    }
    cashierSalesMap[tx.cashierId].transactionCount += 1;
    cashierSalesMap[tx.cashierId].revenue += tx.total;

    // Daily breakdown for charts
    const dayKey = new Date(tx.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });

    if (!dailyChartMap[dayKey]) {
      dailyChartMap[dayKey] = {
        date: dayKey,
        revenue: 0,
        count: 0,
        profit: 0,
        cashInflow: 0,
      };
    }
    dailyChartMap[dayKey].revenue += tx.total;
    dailyChartMap[dayKey].count += 1;

    const instantNonDebtPaid = tx.paymentMethod === "DEBT" ? 0 : tx.total;
    dailyChartMap[dayKey].cashInflow += instantNonDebtPaid;

    // Items and profit calculation
    for (const item of tx.items) {
      totalItemsSold += item.quantity;
      const cost = (item.product?.costPrice || 0) * item.quantity;
      totalCost += cost;
      const itemProfit = item.subtotal - cost;

      dailyChartMap[dayKey].profit += itemProfit;

      const pKey = item.productId || item.productName;
      if (!productSalesMap[pKey]) {
        productSalesMap[pKey] = {
          name: item.productName,
          categoryName: item.product?.category?.name || "Umum",
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
      }
      productSalesMap[pKey].quantity += item.quantity;
      productSalesMap[pKey].revenue += item.subtotal;
      productSalesMap[pKey].profit += itemProfit;
    }
  }

  // Add Debt Payments into daily cashInflow chart
  for (const dp of debtPayments) {
    const dpKey = new Date(dp.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    if (!dailyChartMap[dpKey]) {
      dailyChartMap[dpKey] = {
        date: dpKey,
        revenue: 0,
        count: 0,
        profit: 0,
        cashInflow: 0,
      };
    }
    dailyChartMap[dpKey].cashInflow += dp.amount;
  }

  // Calculate Debt Payments collected in this period (contains both DP and installments)
  const totalDebtPaymentsCollected = debtPayments.reduce((acc, p) => acc + p.amount, 0);

  // Total Real Cash Inflow = (Cash sales + QRIS sales + all Debt Payments / DP received)
  const totalCashInflow = cashRevenue + qrisRevenue + totalDebtPaymentsCollected;
  const grossProfit = totalRevenue - totalCost;
  const transactionCount = transactions.length;
  const averageOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  // Best Selling Products sorted by quantity sold
  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Daily Chart Data array
  const chartData = Object.values(dailyChartMap);

  // Cashier performance array
  const cashierPerformance = Object.values(cashierSalesMap).sort(
    (a, b) => b.revenue - a.revenue
  );

  return {
    metrics: {
      totalRevenue,
      totalCashInflow,
      grossProfit,
      totalDiscount,
      totalItemsSold,
      transactionCount,
      averageOrderValue,
      breakdown: {
        cashRevenue,
        qrisRevenue,
        debtSalesTotal,
        debtDownPaymentTotal,
        unpaidDebtInPeriod,
        totalDebtPaymentsCollected,
      },
    },
    chartData,
    bestSellers,
    cashierPerformance,
    recentDebtPayments: debtPayments.slice(0, 5),
  };
}
