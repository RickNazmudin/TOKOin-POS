"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export interface SalesReportFilter {
  period: "TODAY" | "YESTERDAY" | "7_DAYS" | "30_DAYS" | "ALL";
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

  const whereCondition: Prisma.TransactionWhereInput = {
    status: "COMPLETED",
  };

  if (startDate && endDate) {
    whereCondition.createdAt = { gte: startDate, lte: endDate };
  } else if (startDate) {
    whereCondition.createdAt = { gte: startDate };
  }

  // Fetch transactions in period
  const transactions = await prisma.transaction.findMany({
    where: whereCondition,
    include: {
      cashier: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate Metrics
  let totalRevenue = 0;
  let totalCost = 0;
  let totalDiscount = 0;
  let totalItemsSold = 0;

  const productSalesMap: Record<string, { name: string; categoryName: string; quantity: number; revenue: number; profit: number }> = {};
  const cashierSalesMap: Record<string, { name: string; transactionCount: number; revenue: number }> = {};
  const dailyChartMap: Record<string, { date: string; revenue: number; count: number; profit: number }> = {};

  for (const tx of transactions) {
    totalRevenue += tx.total;
    totalDiscount += tx.discount;

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
      };
    }
    dailyChartMap[dayKey].revenue += tx.total;
    dailyChartMap[dayKey].count += 1;

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
          categoryName: item.product?.categoryId ? "Barang Warung" : "Umum",
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
      grossProfit,
      totalDiscount,
      totalItemsSold,
      transactionCount,
      averageOrderValue,
    },
    chartData,
    bestSellers,
    cashierPerformance,
  };
}
