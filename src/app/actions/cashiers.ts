"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// 1. Get Cashiers
export async function getCashiers() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Akses ditolak.");
  }

  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });
}

// 2. Create Cashier
export async function createCashier(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya Admin yang dapat menambah pengguna." };
  }

  const name = (formData.get("name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const email = (formData.get("email") as string)?.trim().toLowerCase() || null;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "CASHIER";

  if (!name || !username || !password) {
    return { success: false, message: "Nama, Username, dan Kata Sandi wajib diisi." };
  }

  if (password.length < 6) {
    return { success: false, message: "Kata sandi minimal 6 karakter." };
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  });

  if (existing) {
    return { success: false, message: `Username "${username}" sudah digunakan oleh orang lain.` };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        role: role === "ADMIN" ? "ADMIN" : "CASHIER",
        status: "ACTIVE",
      },
    });

    revalidatePath("/admin/cashiers");
    return { success: true, message: `Akun kasir "${name}" berhasil dibuat.` };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membuat akun kasir.";
    return { success: false, message: msg };
  }
}

// 3. Update Cashier
export async function updateCashier(id: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  const name = (formData.get("name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const email = (formData.get("email") as string)?.trim().toLowerCase() || null;
  const role = formData.get("role") as string;
  const status = formData.get("status") as string;

  if (!name || !username) {
    return { success: false, message: "Nama dan Username wajib diisi." };
  }

  const existing = await prisma.user.findFirst({
    where: {
      username,
      NOT: { id },
    },
  });

  if (existing) {
    return { success: false, message: `Username "${username}" sudah digunakan.` };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        username,
        email,
        role: role === "ADMIN" ? "ADMIN" : "CASHIER",
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    });

    revalidatePath("/admin/cashiers");
    return { success: true, message: "Data kasir berhasil diperbarui." };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui kasir.";
    return { success: false, message: msg };
  }
}

// 4. Toggle Status
export async function toggleCashierStatus(id: string, currentStatus: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  if (user.id === id) {
    return { success: false, message: "Anda tidak dapat menonaktifkan akun Anda sendiri." };
  }

  const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  try {
    await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/admin/cashiers");
    return {
      success: true,
      message: `Status akun kasir berhasil diubah menjadi ${newStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`,
    };
  } catch {
    return { success: false, message: "Gagal mengubah status akun." };
  }
}

// 5. Reset Password
export async function resetCashierPassword(id: string, newPass: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak." };
  }

  if (!newPass || newPass.length < 6) {
    return { success: false, message: "Kata sandi baru minimal 6 karakter." };
  }

  try {
    const hashedPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Kata sandi berhasil direset." };
  } catch {
    return { success: false, message: "Gagal mereset kata sandi." };
  }
}
