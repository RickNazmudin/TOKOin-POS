"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { success: false, message: "Akses ditolak. Hanya Pemilik/Admin yang dapat mengubah pengaturan toko." };
  }

  const storeName = (formData.get("storeName") as string)?.trim();
  const address = (formData.get("address") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const receiptFooter = (formData.get("receiptFooter") as string)?.trim() || null;

  if (!storeName) {
    return { success: false, message: "Nama toko wajib diisi." };
  }

  try {
    const settings = await prisma.storeSettings.upsert({
      where: { id: "default_store" },
      update: {
        storeName,
        address,
        phone,
        receiptFooter,
      },
      create: {
        id: "default_store",
        storeName,
        address,
        phone,
        receiptFooter,
      },
    });

    revalidatePath("/admin/settings");
    revalidatePath("/admin/dashboard");
    revalidatePath("/pos");

    return {
      success: true,
      message: "Pengaturan toko dan format cetak struk berhasil disimpan!",
      settings,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menyimpan pengaturan toko.";
    return {
      success: false,
      message: msg,
    };
  }
}
